from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.database import SessionLocal
from ..db.models import RawFile, NormalizedEntry
from pydantic import BaseModel, field_validator
import hashlib, os, csv, io
from typing import List, Optional

router = APIRouter()

class CSVEntryModel(BaseModel):
    date: Optional[str] = ""
    vendor: Optional[str] = ""
    amount: float = 0.0
    vat: float = 0.0
    memo: Optional[str] = ""
    
    @field_validator('amount', 'vat', mode='before')
    @classmethod
    def validate_numbers(cls, v):
        if v is None or v == "":
            return 0.0
        try:
            return float(v)
        except (ValueError, TypeError):
            return 0.0

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def sha256sum(data: bytes) -> str:
    import hashlib
    h = hashlib.sha256(); h.update(data); return h.hexdigest()

@router.post("/upload")
async def upload(period: str = Form("2025-09"),
                 source: str = Form("hometax_csv"),
                 file: UploadFile = File(...),
                 db: Session = Depends(get_db)):
    """파일 업로드 및 처리"""
    try:
        # 파일 유효성 검사
        if not file or not file.filename:
            raise HTTPException(400, "파일이 선택되지 않았습니다")
        
        # 파일 확장자 검사
        allowed_extensions = ['.csv', '.xlsx', '.xls']
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(400, f"지원하지 않는 파일 형식입니다. 허용: {', '.join(allowed_extensions)}")
        
        content = await file.read()
        if not content or len(content) == 0:
            raise HTTPException(400, "빈 파일입니다")
        
        # 파일 크기 제한 (10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(content) > max_size:
            raise HTTPException(400, f"파일 크기가 너무 큽니다. 최대 {max_size // (1024*1024)}MB")
        
        checksum = sha256sum(content)
        os.makedirs("./data", exist_ok=True)
        local_path = f"./data/{checksum}_{file.filename}"
        
        # 파일 저장
        with open(local_path, "wb") as f:
            f.write(content)
        
        # 데이터베이스에 파일 정보 저장
        rf = RawFile(period=period, source=source, mime=file.content_type or "", checksum=checksum, s3_uri=local_path)
        db.add(rf)
        db.commit()
        db.refresh(rf)

        # CSV 파일 파싱
        count = 0
        if file_ext == '.csv':
            try:
                text = content.decode("utf-8", errors="ignore")
                reader = csv.DictReader(io.StringIO(text))
                
                for idx, row in enumerate(reader, start=1):
                    # 숫자 데이터 변환
                    try:
                        amount = float(row.get("amount", 0)) if row.get("amount") else 0
                        vat = float(row.get("vat", 0)) if row.get("vat") else 0
                    except (ValueError, TypeError):
                        amount = 0
                        vat = 0
                    
                    e = NormalizedEntry(
                        file_id=rf.id, 
                        raw_line=idx,
                        trx_date=row.get("date", ""), 
                        vendor=row.get("vendor", ""),
                        amount=amount, 
                        vat=vat, 
                        memo=row.get("memo", "")
                    )
                    db.add(e)
                    count += 1
                    
                db.commit()
            except Exception as e:
                # CSV 파싱 오류 시에도 파일은 저장됨
                print(f"CSV 파싱 오류: {e}")

        # 자동 분류 시도
        classified = 0
        try:
            from ..services.classification import classify_entries_for_file
            classified = classify_entries_for_file(db, rf.id)
        except Exception as e:
            print(f"자동 분류 오류: {e}")
            # 분류 실패해도 업로드는 성공으로 처리

        return {
            "ok": True, 
            "raw_file_id": rf.id, 
            "stored_entries": count, 
            "classified": classified,
            "filename": file.filename,
            "size_bytes": len(content)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"파일 업로드 오류: {e}")
        raise HTTPException(500, f"파일 업로드 중 오류가 발생했습니다: {str(e)}")
