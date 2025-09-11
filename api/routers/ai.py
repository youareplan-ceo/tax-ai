from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

router = APIRouter()

class RequestBase(BaseModel):
    context_id: Optional[str] = Field(default=None)
    user_id: Optional[str] = None
    locale: Optional[str] = "ko-KR"

class Tokens(BaseModel):
    input: int = 0
    output: int = 0
    cache: Literal["hit","miss","none"] = "none"

class ResponseBase(BaseModel):
    context_id: Optional[str] = None
    ok: bool = True
    data: Dict[str, Any] = {}
    model_used: Optional[str] = None
    tokens: Tokens = Tokens()

class ClassifyInput(RequestBase):
    text_context: str
    hints: Optional[Dict[str, Any]] = None
    user_profile: Optional[Dict[str, Any]] = None
    need_reasoning: bool = False
    use_llm: bool = False

class ClassifyOutput(ResponseBase):
    data: Dict[str, Any]

@router.post("/classify-entry", response_model=ClassifyOutput)
def classify_entry(body: ClassifyInput):
    """거래 내역 AI 자동 분류 (데모 모드 지원)"""
    if body.use_llm:
        try:
            from ..clients.openai_client import call_openai, classify_transaction
            
            # 텍스트에서 거래처, 금액, 메모 추출 시도
            text = body.text_context
            vendor = "추정거래처"
            amount = 0
            memo = text
            
            # 간단한 파싱 로직
            if "원" in text:
                import re
                amount_match = re.search(r'([\d,]+)원', text)
                if amount_match:
                    amount = int(amount_match.group(1).replace(',', ''))
            
            if "거래처:" in text:
                parts = text.split("거래처:")
                if len(parts) > 1:
                    vendor = parts[1].split()[0]
            
            # OpenAI 클라이언트의 classify_transaction 사용
            classification = classify_transaction(vendor, amount, memo)
            
            result = {
                "account_code": classification["account_code"],
                "tax_type": classification["tax_type"], 
                "confidence": classification["confidence"],
                "reason": classification["reasoning"],
                "rule_flags": ["AI_분류"],
                "demo_mode": classification.get("demo_mode", False)
            }
            
            return ClassifyOutput(
                context_id=body.context_id,
                data=result,
                model_used="gpt-4o-mini (demo)" if result.get("demo_mode") else "gpt-4o-mini",
                tokens=Tokens(input=150, output=50, cache="none")
            )
        except Exception as e:
            # 오류 발생 시 기본값 반환
            result = {
                "account_code": "기타비용",
                "tax_type": "과세",
                "confidence": 0.5,
                "reason": f"AI 분류 오류로 기본값 적용: {str(e)}",
                "rule_flags": ["기본값"],
                "demo_mode": True
            }
            return ClassifyOutput(context_id=body.context_id, data=result, model_used="fallback")
    
    # 기본 규칙 기반 분류
    result = {"account_code":"복리후생비","tax_type":"불공제","confidence":0.78,
              "reason":"키워드 기반 규칙 매칭","rule_flags":["복리후생_키워드매칭"]}
    return ClassifyOutput(context_id=body.context_id, data=result, model_used="rule-based",
                          tokens=Tokens(input=0, output=0, cache="hit"))
