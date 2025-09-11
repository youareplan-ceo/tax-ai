import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker, declarative_base

DB_URL = os.getenv("DB_URL", "sqlite:///./app.db")

# Performance tuning: connection pool and timeout settings
engine = create_engine(
    DB_URL, 
    future=True, 
    echo=False,
    pool_size=20,
    max_overflow=10,
    pool_timeout=5,
    pool_recycle=3600
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base(metadata=MetaData())
