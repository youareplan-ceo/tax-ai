from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from .routers import ai, ingest, tax, prep, entries
from .db.utils import init_db
import time
from cachetools import TTLCache

app = FastAPI(title="YouaPlan EasyTax API v8", version="0.8.0")

# Performance: Add gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache for tax estimates (15 minutes TTL)
tax_cache = TTLCache(maxsize=100, ttl=900)

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
    return {
        "ok": True, 
        "pool": "20/10",
        "timeout": "5s",
        "cache": "15min_ttl",
        "compression": "gzip"
    }

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
