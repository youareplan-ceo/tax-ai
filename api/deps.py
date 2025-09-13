"""
Database dependency 안전가드
"""

from sqlalchemy.orm import Session
from .db.database import SessionLocal
from fastapi import Depends
import logging

logger = logging.getLogger(__name__)

def get_db() -> Session:
    """DB 세션 의존성 - 안전가드 포함"""
    db = None
    try:
        db = SessionLocal()
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        if db:
            db.rollback()
        raise
    finally:
        if db:
            db.close()