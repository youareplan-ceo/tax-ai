from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, FileResponse
from .routers import ai, ingest, tax, prep, entries
from .db.utils import init_db
import time
from cachetools import TTLCache
import os

app = FastAPI(title="TAX AI")

# Performance: Add gzip compression (최소 크기 하향 조정)
app.add_middleware(GZipMiddleware, minimum_size=256)

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

# / → /app/ 로 리다이렉트
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/app/")

# /app 정적 파일 제공 (ui 폴더 사용)
UI_DIR = os.path.join(os.path.dirname(__file__), "..", "ui")
app.mount("/app", StaticFiles(directory=UI_DIR, html=True), name="app")

# Enhanced middleware for caching and security headers
@app.middleware("http")
async def add_cache_and_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # 정적 파일 캐싱
    if request.url.path.startswith("/app/"):
        response.headers["Cache-Control"] = "public, max-age=604800"
        response.headers["Vary"] = "Accept-Encoding"
        # ETag 추가 (파일 경로 기반 간단 해시)
        etag = f'"{hash(request.url.path) % 1000000:06d}"'
        response.headers["ETag"] = etag
    
    # 보안 헤더 (긴급 최소)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "accelerometer=(),camera=(),microphone=()"
    
    return response

@app.on_event("startup")
def _startup():
    init_db()

@app.get("/health", include_in_schema=False)
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
