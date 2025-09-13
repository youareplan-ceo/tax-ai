from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from ..deps import get_db
from ..db.models import RawFile, NormalizedEntry
from ..schemas import BaseResponse, UploadFileRequest
from pydantic import BaseModel, field_validator
import hashlib, os, csv, io, logging
from typing import List, Optional

logger = logging.getLogger(__name__)
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
            # 쉼표나 특수문자 제거
            if isinstance(v, str):
                v = v.replace(',', '').replace('₩', '').replace('+', '').replace('-', '-')
            return float(v)
        except (ValueError, TypeError):
            return 0.0

def sha256sum(data: bytes) -> str:
    import hashlib
    h = hashlib.sha256(); h.update(data); return h.hexdigest()

@router.post("/upload", response_model=BaseResponse)
async def upload_file(
    period: str = Form("2025-09", description="기간 (YYYY-MM)"),
    source: str = Form("manual_upload", description="데이터 소스"),
    file: UploadFile = File(..., description="업로드할 CSV/Excel 파일"),
    db: Session = Depends(get_db)
):
    """CSV/Excel 파일 업로드 및 처리 - 고도화된 방어코딩"""
    try:
        # 파일 유효성 검사
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="파일이 선택되지 않았습니다")
        
        # 파일 확장자 및 MIME 타입 검사
        allowed_extensions = ['.csv', '.xlsx', '.xls']
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"지원하지 않는 파일 형식입니다. 허용 확장자: {', '.join(allowed_extensions)}"
            )
        
        # 파일 내용 읽기
        content = await file.read()
        if not content or len(content) == 0:
            raise HTTPException(status_code=400, detail="빈 파일입니다")
        
        # 파일 크기 제한 (환경변수에서 가져오기, 기본 10MB)
        max_size = int(os.getenv('MAX_FILE_SIZE', 10485760))  # 10MB
        if len(content) > max_size:
            raise HTTPException(
                status_code=400, 
                detail=f"파일 크기가 너무 큽니다. 최대 {max_size // (1024*1024)}MB"
            )
        
        # 체크섬 및 파일 저장
        checksum = sha256sum(content)
        
        # 중복 파일 체크
        existing_file = db.query(RawFile).filter(RawFile.checksum == checksum).first()
        if existing_file:
            logger.info(f"중복 파일 감지: {file.filename} (체크섬: {checksum[:8]})")
            return BaseResponse(
                data={
                    "raw_file_id": existing_file.id,
                    "filename": file.filename,
                    "message": "동일한 파일이 이미 업로드되었습니다",
                    "duplicate": True
                },
                message="중복 파일이 감지되어 기존 데이터를 반환합니다"
            )
        
        # 파일 저장 디렉터리 확인
        data_dir = "./data"
        os.makedirs(data_dir, exist_ok=True)
        local_path = os.path.join(data_dir, f"{checksum[:8]}_{file.filename}")
        
        with open(local_path, "wb") as f:
            f.write(content)
        logger.info(f"파일 저장 완료: {local_path}")
        
        # 데이터베이스에 파일 정보 저장
        raw_file = RawFile(
            period=period,
            source=source,
            mime=file.content_type or "application/octet-stream",
            checksum=checksum,
            s3_uri=local_path
        )
        db.add(raw_file)
        db.commit()
        db.refresh(raw_file)
        logger.info(f"파일 메타데이터 저장: ID={raw_file.id}")

        # CSV 파일 파싱
        entry_count = 0
        parsing_errors = []
        
        if file_ext == '.csv':
            try:
                # 인코딩 자동 감지 (UTF-8 우선, CP949 대비)
                try:
                    text = content.decode("utf-8")
                except UnicodeDecodeError:
                    try:
                        text = content.decode("cp949")
                        logger.info("CP949 인코딩으로 파일 읽기")
                    except UnicodeDecodeError:
                        text = content.decode("utf-8", errors="ignore")
                        logger.warning("인코딩 오류가 있어 일부 문자를 무시하고 처리")
                
                # CSV 파싱
                csv_reader = csv.DictReader(io.StringIO(text))
                batch_size = 100  # 배치 처리
                batch = []
                
                for idx, row in enumerate(csv_reader, start=1):
                    try:
                        # 데이터 정제 및 검증
                        entry_data = CSVEntryModel(**row)
                        
                        entry = NormalizedEntry(
                            file_id=raw_file.id,
                            raw_line=idx,
                            trx_date=entry_data.date[:10] if entry_data.date else "",  # YYYY-MM-DD만
                            vendor=(entry_data.vendor or "")[:500],  # 길이 제한
                            amount=entry_data.amount,
                            vat=entry_data.vat,
                            memo=(entry_data.memo or "")[:1000]  # 메모 길이 제한
                        )
                        batch.append(entry)
                        entry_count += 1
                        
                        # 배치 저장
                        if len(batch) >= batch_size:
                            db.add_all(batch)
                            db.commit()
                            batch = []
                            
                    except Exception as e:
                        parsing_errors.append(f"라인 {idx}: {str(e)}")
                        if len(parsing_errors) > 10:  # 에러가 너무 많으면 중단
                            raise Exception(f"파싱 오류가 {len(parsing_errors)}개 이상 발생했습니다")
                
                # 남은 배치 저장
                if batch:
                    db.add_all(batch)
                    db.commit()
                    
                logger.info(f"CSV 파싱 완료: {entry_count}개 엔트리, {len(parsing_errors)}개 오류")
                
            except Exception as e:
                logger.error(f"CSV 파싱 오류: {e}")
                # 파싱 실패해도 파일은 저장됨
                parsing_errors.append(f"전체 파싱 실패: {str(e)}")

        # 자동 분류 시도 (비동기로 처리할 수도 있음)
        classified_count = 0
        classification_error = None
        
        try:
            # 분류 서비스가 있다면 호출
            # classified_count = await classify_entries_async(db, raw_file.id)
            logger.info("자동 분류 서비스는 구현 예정입니다")
        except Exception as e:
            classification_error = str(e)
            logger.warning(f"자동 분류 실패: {e}")

        return BaseResponse(
            data={
                "raw_file_id": raw_file.id,
                "stored_entries": entry_count,
                "classified_entries": classified_count,
                "filename": file.filename,
                "size_bytes": len(content),
                "checksum": checksum[:16],
                "parsing_errors": parsing_errors if parsing_errors else None,
                "classification_error": classification_error
            },
            message=f"파일 업로드 완료: {entry_count}개 엔트리 처리됨"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"파일 업로드 오류: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"파일 업로드 처리 중 오류가 발생했습니다: {str(e)}"
        )
