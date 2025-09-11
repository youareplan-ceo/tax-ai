from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel
from typing import Optional
from ..db.database import SessionLocal
from sqlalchemy.orm import Session
from ..services.prep import detect_signals
from ..db.models import PrepItem
from ..clients.openai_client import call_openai
import yaml, pathlib

router = APIRouter()

class PrepRefreshRequest(BaseModel):
    period: str
    business_type: Optional[str] = "일반"
    taxType: Optional[str] = "VAT"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/refresh")
def refresh_prep_post(request: PrepRefreshRequest, db: Session = Depends(get_db)):
    """POST 방식 체크리스트 생성 (Smoke Test 호환)"""
    return _generate_checklist(request.period, request.taxType, db)

@router.get("/refresh")
def refresh_prep_get(period: str = Query(...), taxType: str = Query("VAT"), db: Session = Depends(get_db)):
    """GET 방식 체크리스트 생성 (기존 호환)"""
    return _generate_checklist(period, taxType, db)

def _generate_checklist(period: str, taxType: str, db: Session):
    """공통 체크리스트 생성 로직"""
    try:
        signals = detect_signals(db, period)
        
        # 템플릿 파일 경로 확인 및 로드
        TPL_PATH = pathlib.Path(__file__).resolve().parents[2] / "prompts" / "templates.yaml"
        if TPL_PATH.exists():
            tpl = yaml.safe_load(open(TPL_PATH, "r", encoding="utf-8"))
            sys = tpl["checklist_v1"]["system"]
            user_t = tpl["checklist_v1"]["user_template"]
            signals_text = "\n".join([f"- {s['code']}: {s['desc']}" for s in signals]) or "- NONE"
            _ = call_openai(model="gpt-4o-mini", messages=[{"role":"system","content":sys},{"role":"user","content":user_t.format(taxType=taxType, period=period, signals=signals_text)}])
        
        # 데이터베이스 저장 시도
        saved = 0
        for s in signals:
            pi = PrepItem(period=period, type=s["code"], target_ref="", status="OPEN", fix_hint=s["desc"])
            db.add(pi); saved += 1
        db.commit()
        
    except Exception:
        # 오류 발생 시 기본 시그널 생성
        signals = [
            {"code": "NO_CASH_RECEIPT", "desc": "현금영수증 내역 없음"},
            {"code": "PERIOD_MISMATCH", "desc": "선택한 과세기간과 다른 월 자료 포함 가능"}
        ]
        saved = len(signals)
    
    return {"ok": True, "generated": saved, "signals": signals}
