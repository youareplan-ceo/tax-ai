from sqlalchemy.orm import Session
from ..db.models import NormalizedEntry
from typing import List, Dict

def detect_signals(db: Session, period: str) -> List[Dict]:
    signals = []
    has_cash = db.query(NormalizedEntry).filter(NormalizedEntry.memo.like("%현금영수증%")).first()
    if not has_cash:
        signals.append({"code":"NO_CASH_RECEIPT","desc":"현금영수증 내역 없음"})
    if len(period) == 7:
        mismatch = db.query(NormalizedEntry).filter(~NormalizedEntry.trx_date.like(f"{period}-%")).first()
        if mismatch:
            signals.append({"code":"PERIOD_MISMATCH","desc":"선택한 과세기간과 다른 월 자료 포함 가능"})
    return signals
