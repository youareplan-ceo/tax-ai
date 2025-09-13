"""
자체 점검 및 디버그 라우터
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..deps import get_db
from ..db.models import User, RawFile, NormalizedEntry, ClassifiedEntry, PrepItem
from ..schemas import BaseResponse
import logging, os, sys, platform
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/system", response_model=BaseResponse)
def system_info():
    """시스템 정보 확인"""
    return BaseResponse(
        data={
            "platform": platform.system(),
            "python_version": platform.python_version(),
            "working_directory": os.getcwd(),
            "environment_variables": {
                "OPENAI_API_KEY": "***" if os.getenv("OPENAI_API_KEY") else "NOT_SET",
                "DATABASE_URL": os.getenv("DATABASE_URL", "sqlite:///./youareplan_tax_ai.db"),
                "LOG_LEVEL": os.getenv("LOG_LEVEL", "INFO")
            },
            "directories": {
                "data_exists": os.path.exists("./data"),
                "logs_exists": os.path.exists("./logs"),
                "ui_exists": os.path.exists("./ui")
            }
        },
        message="시스템 정보 조회 완료"
    )

@router.get("/database", response_model=BaseResponse)
def database_status(db: Session = Depends(get_db)):
    """데이터베이스 상태 점검"""
    try:
        # 각 테이블 행 수 확인
        user_count = db.query(User).count()
        file_count = db.query(RawFile).count()
        entry_count = db.query(NormalizedEntry).count()
        classified_count = db.query(ClassifiedEntry).count()
        prep_count = db.query(PrepItem).count()
        
        # 최근 데이터 확인
        latest_entry = db.query(NormalizedEntry).order_by(NormalizedEntry.created_at.desc()).first()
        latest_file = db.query(RawFile).order_by(RawFile.uploaded_at.desc()).first()
        
        return BaseResponse(
            data={
                "table_counts": {
                    "users": user_count,
                    "raw_files": file_count,
                    "normalized_entries": entry_count,
                    "classified_entries": classified_count,
                    "prep_items": prep_count
                },
                "latest_data": {
                    "latest_entry_date": latest_entry.created_at.isoformat() if latest_entry else None,
                    "latest_file_date": latest_file.uploaded_at.isoformat() if latest_file else None
                },
                "database_connection": "OK"
            },
            message="데이터베이스 상태 점검 완료"
        )
    except Exception as e:
        logger.error(f"데이터베이스 상태 점검 오류: {e}")
        return BaseResponse(
            success=False,
            data={"error": str(e)},
            message="데이터베이스 연결 실패"
        )

@router.get("/endpoints")
def list_endpoints():
    """등록된 엔드포인트 목록"""
    from ...main import app
    
    routes = []
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            routes.append({
                "path": route.path,
                "methods": list(route.methods) if route.methods else [],
                "name": getattr(route, 'name', 'unnamed')
            })
    
    return BaseResponse(
        data={
            "total_routes": len(routes),
            "routes": sorted(routes, key=lambda x: x['path'])
        },
        message=f"{len(routes)}개 엔드포인트 등록됨"
    )

@router.get("/sample-data", response_model=BaseResponse)  
def generate_sample_data(db: Session = Depends(get_db)):
    """샘플 데이터 생성 (개발용)"""
    try:
        # 샘플 사용자 생성
        user = User(email="test@youareplan.co.kr", locale="ko-KR")
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # 샘플 파일 생성
        raw_file = RawFile(
            user_id=user.id,
            period="2025-09",
            source="sample_data",
            mime="text/csv",
            checksum="sample_checksum_123",
            s3_uri="./data/sample.csv"
        )
        db.add(raw_file)
        db.commit()
        db.refresh(raw_file)
        
        # 샘플 거래 내역 생성
        sample_entries = [
            NormalizedEntry(
                user_id=user.id,
                file_id=raw_file.id,
                raw_line=1,
                trx_date="2025-09-10",
                vendor="스타벅스 강남점",
                amount=-5500,
                vat=-500,
                memo="커피 구매"
            ),
            NormalizedEntry(
                user_id=user.id,
                file_id=raw_file.id,
                raw_line=2,
                trx_date="2025-09-11",
                vendor="이마트 본점",
                amount=-25000,
                vat=-2273,
                memo="생필품 구매"
            ),
            NormalizedEntry(
                user_id=user.id,
                file_id=raw_file.id,
                raw_line=3,
                trx_date="2025-09-01",
                vendor="급여 입금",
                amount=3200000,
                vat=0,
                memo="9월 급여"
            )
        ]
        
        for entry in sample_entries:
            db.add(entry)
        
        db.commit()
        
        return BaseResponse(
            data={
                "created_user_id": user.id,
                "created_file_id": raw_file.id,
                "created_entries": len(sample_entries)
            },
            message="샘플 데이터 생성 완료"
        )
        
    except Exception as e:
        logger.error(f"샘플 데이터 생성 오류: {e}")
        db.rollback()
        return BaseResponse(
            success=False,
            data={"error": str(e)},
            message="샘플 데이터 생성 실패"
        )

@router.post("/clear-data", response_model=BaseResponse)
def clear_all_data(db: Session = Depends(get_db)):
    """모든 데이터 삭제 (주의!)"""
    try:
        # 외래키 순서에 따라 삭제
        db.query(ClassifiedEntry).delete()
        db.query(PrepItem).delete()
        db.query(NormalizedEntry).delete()
        db.query(RawFile).delete()
        db.query(User).delete()
        
        db.commit()
        
        return BaseResponse(
            data={"cleared": True},
            message="모든 데이터가 삭제되었습니다"
        )
        
    except Exception as e:
        logger.error(f"데이터 삭제 오류: {e}")
        db.rollback()
        return BaseResponse(
            success=False,
            data={"error": str(e)},
            message="데이터 삭제 실패"
        )