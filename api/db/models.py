from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Numeric, Text
from .database import Base
import datetime, uuid

def now():
    return datetime.datetime.utcnow()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=True)
    locale = Column(String, default="ko-KR")
    created_at = Column(DateTime, default=now)

class RawFile(Base):
    __tablename__ = "raw_files"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    period = Column(String)
    source = Column(String)
    mime = Column(String)
    checksum = Column(String, unique=True)
    s3_uri = Column(String)
    uploaded_at = Column(DateTime, default=now)

class NormalizedEntry(Base):
    __tablename__ = "normalized_entries"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    file_id = Column(String, ForeignKey("raw_files.id"), nullable=True)
    raw_line = Column(Integer)
    trx_date = Column(String)   # YYYY-MM-DD 텍스트로
    vendor = Column(Text)
    amount = Column(Numeric(18,2))
    vat = Column(Numeric(18,2))
    memo = Column(Text)
    created_at = Column(DateTime, default=now)

class ClassifiedEntry(Base):
    __tablename__ = "classified_entries"
    entry_id = Column(Integer, primary_key=True)
    account_code = Column(Text)
    tax_type = Column(Text)  # 과세/면세/불공제
    confidence = Column(String)
    model_used = Column(Text)
    reason = Column(Text)
    flags = Column(Text)
    updated_at = Column(DateTime, default=now)

class PrepItem(Base):
    __tablename__ = "prep_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=True)
    period = Column(String)
    type = Column(String)
    target_ref = Column(String)
    status = Column(String)
    fix_hint = Column(Text)
    updated_at = Column(DateTime, default=now)
