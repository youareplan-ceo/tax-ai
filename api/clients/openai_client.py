import os, time, json
from typing import Dict, Any, List, Optional
from ..utils.logger import log_jsonl
from ..utils.costs import estimate_cost

# YouArePlan EasyTax v8 - OpenAI API 클라이언트
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL_CLASSIFY = os.getenv("OPENAI_MODEL_CLASSIFY", "gpt-4o-mini")
OPENAI_MODEL_ANALYSIS = os.getenv("OPENAI_MODEL_ANALYSIS", "gpt-4o")
OPENAI_MAX_TOKENS = int(os.getenv("OPENAI_MAX_TOKENS", "1000"))
OPENAI_TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", "0.3"))

def _sdk_available():
    try:
        import openai  # noqa
        return True
    except Exception:
        return False

def _call_sdk(model: str, messages: List[dict], **kwargs) -> Dict[str, Any]:
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)
    resp = client.chat.completions.create(model=model, messages=messages, **kwargs)
    usage = getattr(resp, "usage", None)
    usage_dict = {
        "prompt_tokens": getattr(usage, "prompt_tokens", 0) if usage else 0,
        "completion_tokens": getattr(usage, "completion_tokens", 0) if usage else 0,
        "total_tokens": getattr(usage, "total_tokens", 0) if usage else 0,
    }
    content = resp.choices[0].message.content if resp.choices else ""
    return {"model": model, "messages": messages, "usage": usage_dict,
            "choices":[{"message":{"role":"assistant","content":content}}]}

def call_openai(model: str, messages: list, retries: int = 2, **kwargs) -> Dict[str, Any]:
    """OpenAI API 호출 (데모 모드 지원)"""
    # 데모용 키인 경우 시뮬레이션된 응답 반환
    if OPENAI_API_KEY.startswith("sk-proj-demo"):
        # 사용자 메시지에서 키워드를 기반으로 한 스마트 응답 생성
        user_content = ""
        for msg in messages:
            if msg.get("role") == "user":
                user_content += msg.get("content", "")
        
        # 한국어 세무 관련 키워드 기반 분류
        demo_response = {
            "account_code": "소모품비" if any(k in user_content for k in ["문구", "사무", "용품"]) else
                           "복리후생비" if any(k in user_content for k in ["카페", "커피", "식대", "회식"]) else
                           "통신비" if any(k in user_content for k in ["통신", "인터넷", "전화"]) else
                           "임차료" if any(k in user_content for k in ["임대", "월세", "사무실"]) else
                           "기타비용",
            "tax_type": "과세",
            "confidence": 0.85,
            "reasoning": "데모 모드 - AI 기반 자동 분류 시뮬레이션"
        }
        
        data = {
            "model": f"{model} (demo)",
            "messages": messages,
            "usage": {"prompt_tokens": 150, "completion_tokens": 50, "total_tokens": 200},
            "choices": [{"message": {"role": "assistant", "content": json.dumps(demo_response, ensure_ascii=False)}}],
            "demo_mode": True
        }
        cost = estimate_cost(150, 50)
        log_jsonl({"event":"openai_call","model":model,"usage":data["usage"],"est_cost":cost,"demo_mode":True,"ok":True})
        data["est_cost"] = cost
        return data
    
    # 실제 API 호출
    use_sdk = bool(OPENAI_API_KEY) and _sdk_available()
    last_err = None
    for attempt in range(retries + 1):
        try:
            if use_sdk:
                data = _call_sdk(model, messages, **kwargs)
            else:
                data = {"model": model, "messages": messages,
                        "usage": {"prompt_tokens":512, "completion_tokens":128, "total_tokens":640},
                        "choices":[{"message":{"role":"assistant","content":"(stub)"}}]}
            usage = data.get("usage", {})
            cost = estimate_cost(usage.get("prompt_tokens",0), usage.get("completion_tokens",0))
            log_jsonl({"event":"openai_call","model":model,"usage":usage,"est_cost":cost,"ok":True})
            data["est_cost"] = cost
            return data
        except Exception as e:
            last_err = str(e)
            time.sleep(0.4*(attempt+1))
    log_jsonl({"event":"openai_call","model":model,"error":last_err,"ok":False})
    raise RuntimeError(f"OpenAI call failed: {last_err}")

def validate_api_key() -> Dict[str, Any]:
    """OpenAI API 키 유효성 검증"""
    if not OPENAI_API_KEY or OPENAI_API_KEY.startswith("sk-test-placeholder"):
        return {
            "valid": False,
            "error": "API 키가 설정되지 않았거나 테스트 키입니다",
            "message": "실제 OpenAI API 키를 .env 파일에 설정해주세요"
        }
    
    # 데모용 테스트 키인 경우 데모 모드로 간주
    if OPENAI_API_KEY.startswith("sk-proj-demo"):
        return {
            "valid": True,
            "demo_mode": True,
            "message": "데모 모드로 작동 중 - 모든 AI 기능이 시뮬레이션됩니다",
            "model": "gpt-4o-mini (demo)"
        }
    
    if not _sdk_available():
        return {
            "valid": False,
            "error": "OpenAI SDK가 설치되지 않았습니다",
            "message": "pip install openai 명령어로 설치해주세요"
        }
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        # 간단한 테스트 요청으로 API 키 검증
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        return {
            "valid": True,
            "message": "API 키가 정상적으로 작동합니다",
            "model": response.model
        }
    except Exception as e:
        return {
            "valid": False,
            "error": str(e),
            "message": "API 키가 유효하지 않거나 요청 중 오류가 발생했습니다"
        }

def classify_transaction(vendor: str, amount: float, memo: str) -> Dict[str, Any]:
    """거래 내역 AI 자동 분류"""
    messages = [
        {
            "role": "system",
            "content": """
당신은 한국의 전문 세무사입니다. 거래 내역을 분석하여 정확한 계정과목과 세금유형을 분류해주세요.

분류 기준:
- 계정과목: 매출, 소모품비, 기타비용, 복리후생, 통신비, 임차료 등
- 세금유형: 과세, 불공제, 영세, 면세
- 불공제 항목: 접대비, 복리후생비 등

JSON 형식으로 응답해주세요:
{
  "account_code": "계정과목",
  "tax_type": "세금유형",
  "confidence": 0.85,
  "reasoning": "분류 근거"
}
"""
        },
        {
            "role": "user",
            "content": f"거래처: {vendor}, 금액: {amount:,.0f}원, 메모: {memo}"
        }
    ]
    
    try:
        response = call_openai(OPENAI_MODEL_CLASSIFY, messages, max_tokens=200, temperature=0.1)
        content = response["choices"][0]["message"]["content"]
        
        # JSON 파싱 시도
        try:
            result = json.loads(content)
            return result
        except json.JSONDecodeError:
            # JSON 파싱 실패 시 기본값 반환
            return {
                "account_code": "기타비용",
                "tax_type": "과세",
                "confidence": 0.5,
                "reasoning": "AI 응답 파싱 실패로 기본 분류 적용"
            }
            
    except Exception as e:
        # API 호출 실패 시 기본값 반환
        return {
            "account_code": "기타비용",
            "tax_type": "과세",
            "confidence": 0.3,
            "reasoning": f"AI 분류 실패: {str(e)}"
        }

def get_api_status() -> Dict[str, Any]:
    """API 상태 정보 반환"""
    validation = validate_api_key()
    is_configured = bool(OPENAI_API_KEY) and not OPENAI_API_KEY.startswith("sk-test-placeholder")
    return {
        "api_key_configured": is_configured,
        "api_key_valid": validation["valid"],
        "demo_mode": validation.get("demo_mode", False),
        "sdk_available": _sdk_available(),
        "models": {
            "classify": OPENAI_MODEL_CLASSIFY,
            "analysis": OPENAI_MODEL_ANALYSIS
        },
        "settings": {
            "max_tokens": OPENAI_MAX_TOKENS,
            "temperature": OPENAI_TEMPERATURE
        },
        "validation_result": validation
    }
