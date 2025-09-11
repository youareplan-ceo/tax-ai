from typing import Tuple
def validate_classification(obj: dict) -> Tuple[bool, str]:
    if not isinstance(obj, dict):
        return False, "not a JSON object"
    for k in ("account_code","tax_type","confidence"):
        if k not in obj:
            return False, f"missing key: {k}"
    if obj["tax_type"] not in ("과세","면세","불공제"):
        return False, "invalid tax_type"
    try:
        c = float(obj["confidence"])
        if not (0.0 <= c <= 1.0):
            return False, "confidence out of range"
    except Exception:
        return False, "confidence not a number"
    return True, ""
