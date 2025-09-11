from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import ai, ingest, tax, prep, entries
from .db.utils import init_db

app = FastAPI(title="YouaPlan EasyTax API v8", version="0.8.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
app.include_router(tax.router, prefix="/tax", tags=["tax"])
app.include_router(prep.router, prefix="/prep", tags=["prep"])
app.include_router(entries.router, prefix="/entries", tags=["entries"])

@app.on_event("startup")
def _startup():
    init_db()

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/api/status")
def api_status():
    """API 상태 및 OpenAI 연동 확인"""
    from .clients.openai_client import get_api_status
    return get_api_status()

@app.get("/api/validate-key")
def validate_openai_key():
    """OpenAI API 키 검증"""
    from .clients.openai_client import validate_api_key
    return validate_api_key()
