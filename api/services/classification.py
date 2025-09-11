from sqlalchemy.orm import Session
from ..db.models import NormalizedEntry, ClassifiedEntry
import os, json, pathlib, re

# load ruleset v0.2
RULES_PATH = pathlib.Path(__file__).resolve().parents[2] / "rules" / "vat_rules_v0_2.json"
RULES = json.loads(open(RULES_PATH, "r", encoding="utf-8").read())

def rule_summary() -> str:
    return "룰셋 v0.2 적용"

def rules_classify(entry: NormalizedEntry) -> dict:
    memo = (entry.memo or "")
    vendor = (entry.vendor or "")
    # vendor hints
    vhint = RULES.get("vendor_hints", {}).get(vendor)
    if vhint:
        return {"account_code": vhint.get("default_account","기타비용"),
                "tax_type": vhint.get("default_tax_type","과세"),
                "confidence": 0.8,
                "reason": "업체 힌트 매칭",
                "flags": "[]"}

    # non-deductible categories
    for cat, kws in RULES["non_deductible"]["keywords"].items():
        if any(k in memo for k in kws):
            reason = RULES["non_deductible"]["reason_map"].get(cat, "불공제")
            account = RULES["account_mapping"].get(kws[0], "기타비용")
            return {"account_code": account, "tax_type":"불공제", "confidence":0.78,
                    "reason": reason, "flags":"[\"NON_DEDUCTIBLE\"]"}

    # zero/exempt hints
    if any(k in memo for k in RULES["classify_hints"]["zero_rated_keywords"]):
        return {"account_code":"매출","tax_type":"과세","confidence":0.72,
                "reason":"영세율 후보","flags":"[\"ZERO_RATED_CANDIDATE\"]"}
    if any(k in memo for k in RULES["classify_hints"]["exempt_keywords"]):
        return {"account_code":"매출","tax_type":"면세","confidence":0.72,
                "reason":"면세 키워드","flags":"[\"EXEMPT\"]"}

    # sales / purchase
    if any(k in memo for k in RULES["classify_hints"]["sales_keywords"]):
        return {"account_code":"매출","tax_type":"과세","confidence":0.7,"reason":"매출 키워드","flags":"[]"}
    if any(k in memo for k in RULES["classify_hints"]["purchase_keywords"]):
        mapped = RULES["account_mapping"].get("소모품","소모품비")
        return {"account_code":mapped,"tax_type":"과세","confidence":0.68,"reason":"매입 키워드","flags":"[]"}

    return {"account_code":"기타비용","tax_type":"과세","confidence":0.55,
            "reason":"규칙 불일치 기본값","flags":"[\"LOW_CONFIDENCE\"]"}

def llm_refine_strict(entry: NormalizedEntry, initial: dict) -> dict:
    try:
        from ..clients.openai_client import call_openai
        from ..validators.classify import validate_classification
        import yaml
        TPL_PATH = pathlib.Path(__file__).resolve().parents[2] / "prompts" / "templates.yaml"
        tpl = yaml.safe_load(open(TPL_PATH, "r", encoding="utf-8"))
        sys = tpl["classify_v1"]["system"] + " 반드시 JSON만 출력하라. 키: account_code, tax_type, confidence, reason, flags"
        user_t = tpl["classify_v1"]["user_template"]
        msg = user_t.format(
            trx_date=entry.trx_date, vendor=entry.vendor, amount=entry.amount, vat=entry.vat,
            memo=entry.memo, industry="서비스", biz_type="간편장부", hints="", rule_summary=rule_summary()
        )
        resp = call_openai(model=os.getenv("OPENAI_MODEL_GENERAL","gpt-4.1-mini"),
                           messages=[{"role":"system","content":sys},{"role":"user","content":msg}], temperature=0)
        content = resp.get("choices",[{}])[0].get("message",{}).get("content","{}")
        try:
            parsed = json.loads(content)
        except Exception:
            m = re.search(r"\{[\s\S]*\}", content)
            parsed = json.loads(m.group(0)) if m else {}
        ok, why = validate_classification(parsed) if parsed else (False, "empty")
        if ok:
            parsed["flags"] = json.dumps(parsed.get("flags", []), ensure_ascii=False)
            return parsed
        initial["reason"] += f" | LLM JSON invalid: {why}"
        return initial
    except Exception:
        initial["reason"] += " | LLM 예외"
        return initial

def classify_entries_for_file(db: Session, file_id: str) -> int:
    rows = db.query(NormalizedEntry).filter(NormalizedEntry.file_id==file_id).all()
    count = 0
    for e in rows:
        pred = rules_classify(e)
        if pred["confidence"] < 0.6:
            pred = llm_refine_strict(e, pred)
        ce = ClassifiedEntry(entry_id=e.id,
                             account_code=pred["account_code"],
                             tax_type=pred["tax_type"],
                             confidence=str(pred["confidence"]),
                             model_used="rules-v0.2+llm",
                             reason=pred["reason"],
                             flags=pred["flags"])
        db.merge(ce); count += 1
    db.commit()
    return count
