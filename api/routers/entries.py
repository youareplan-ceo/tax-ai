from fastapi import APIRouter, Query
from ..db.database import SessionLocal
from ..db.models import NormalizedEntry, ClassifiedEntry

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/list")
def list_entries(period: str = Query(None)):
    db = next(get_db())
    q = db.query(NormalizedEntry, ClassifiedEntry).join(ClassifiedEntry, ClassifiedEntry.entry_id==NormalizedEntry.id, isouter=True)
    if period and len(period) >= 4:
        q = q.filter(NormalizedEntry.trx_date.like(f"{period}%"))
    rows = []
    for e, c in q.all():
        rows.append({"id": e.id, "date": e.trx_date, "vendor": e.vendor,
                     "amount": float(e.amount or 0), "vat": float(e.vat or 0), "memo": e.memo,
                     "account_code": getattr(c, "account_code", None),
                     "tax_type": getattr(c, "tax_type", None),
                     "confidence": getattr(c, "confidence", None)})
    return {"ok": True, "count": len(rows), "items": rows}
