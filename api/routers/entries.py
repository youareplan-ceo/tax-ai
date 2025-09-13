from fastapi import APIRouter, Query, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from typing import Optional
from ..deps import get_db
from ..db.models import NormalizedEntry, ClassifiedEntry
from ..schemas import (
    EntriesListResponse, EntryResponse, BaseResponse,
    DirectEntryRequest, DirectEntryUpdate, DirectEntryResponse,
    TaxCalculationResponse
)
from decimal import Decimal
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/list", response_model=EntriesListResponse)
def list_entries(
    period: Optional[str] = Query(None, description="기간 필터 (YYYY-MM)"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    per_page: int = Query(50, ge=1, le=200, description="페이지당 항목 수"),
    db: Session = Depends(get_db)
):
    """가계부 목록 조회 - 방어코딩 적용"""
    try:
        # 베이스 쿼리 구성
        q = db.query(NormalizedEntry, ClassifiedEntry).join(
            ClassifiedEntry, 
            ClassifiedEntry.entry_id == NormalizedEntry.id, 
            isouter=True
        )
        
        # 기간 필터링
        if period:
            if len(period) < 4:
                raise HTTPException(status_code=400, detail="기간은 최소 YYYY 형식이어야 합니다")
            q = q.filter(NormalizedEntry.trx_date.like(f"{period}%"))
        
        # 전체 개수 계산
        total = q.count()
        
        # 페이지네이션
        offset = (page - 1) * per_page
        results = q.offset(offset).limit(per_page).all()
        
        # 응답 데이터 구성
        entries = []
        for entry, classified in results:
            try:
                entry_data = EntryResponse(
                    id=entry.id,
                    trx_date=entry.trx_date or "",
                    vendor=entry.vendor or "",
                    amount=entry.amount or 0,
                    vat=entry.vat,
                    memo=entry.memo,
                    account_code=getattr(classified, "account_code", None),
                    tax_type=getattr(classified, "tax_type", None)
                )
                entries.append(entry_data)
            except Exception as e:
                logger.warning(f"엔트리 변환 오류 (ID: {entry.id}): {e}")
                continue
        
        return EntriesListResponse(
            data=entries,
            total=total,
            page=page,
            per_page=per_page,
            message=f"{len(entries)}개 항목 조회 완료"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"가계부 목록 조회 오류: {e}")
        raise HTTPException(status_code=500, detail="가계부 목록 조회 중 오류가 발생했습니다")

@router.get("/summary")
def get_summary(
    period: Optional[str] = Query(None, description="기간 필터 (YYYY-MM)"),
    db: Session = Depends(get_db)
):
    """가계부 요약 정보"""
    try:
        q = db.query(NormalizedEntry)
        
        if period:
            if len(period) < 4:
                raise HTTPException(status_code=400, detail="기간은 최소 YYYY 형식이어야 합니다")
            q = q.filter(NormalizedEntry.trx_date.like(f"{period}%"))
        
        entries = q.all()
        
        total_amount = sum(float(e.amount or 0) for e in entries)
        total_vat = sum(float(e.vat or 0) for e in entries)
        
        return BaseResponse(
            data={
                "total_amount": total_amount,
                "total_vat": total_vat,
                "entry_count": len(entries),
                "period": period or "전체"
            },
            message="요약 정보 조회 완료"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"요약 정보 조회 오류: {e}")
        raise HTTPException(status_code=500, detail="요약 정보 조회 중 오류가 발생했습니다")

# 직접 입력 CRUD API
@router.post("/direct", response_model=BaseResponse)
def create_direct_entry(
    entry: DirectEntryRequest,
    db: Session = Depends(get_db)
):
    """직접 입력 거래 생성"""
    try:
        # 새 엔트리 생성
        new_entry = NormalizedEntry(
            file_id=None,  # 직접 입력은 파일 없음
            raw_line=0,
            trx_date=entry.trx_date,
            vendor=entry.vendor,
            amount=entry.amount if entry.transaction_type == 'income' else -entry.amount,
            vat=entry.vat_amount if entry.transaction_type == 'income' else -entry.vat_amount,
            memo=entry.memo or ""
        )
        
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        
        logger.info(f"직접 입력 생성: ID={new_entry.id}, 거래처={entry.vendor}")
        
        return BaseResponse(
            data={
                "id": new_entry.id,
                "trx_date": new_entry.trx_date,
                "vendor": new_entry.vendor,
                "transaction_type": entry.transaction_type,
                "amount": abs(float(new_entry.amount or 0)),
                "vat_amount": abs(float(new_entry.vat or 0)),
                "memo": new_entry.memo,
                "source": "direct_input",
                "created_at": datetime.utcnow().isoformat()
            },
            message=f"{entry.vendor} 거래가 성공적으로 저장되었습니다"
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"직접 입력 생성 오류: {e}")
        raise HTTPException(status_code=500, detail=f"거래 저장 중 오류가 발생했습니다: {str(e)}")

@router.get("/direct", response_model=BaseResponse)
def get_direct_entries(
    page: int = Query(1, ge=1, description="페이지 번호"),
    per_page: int = Query(50, ge=1, le=200, description="페이지당 항목 수"),
    transaction_type: Optional[str] = Query(None, description="거래 유형 (income/expense)"),
    db: Session = Depends(get_db)
):
    """직접 입력 거래 목록 조회"""
    try:
        # 직접 입력 데이터만 조회 (file_id가 None인 것들)
        q = db.query(NormalizedEntry).filter(NormalizedEntry.file_id.is_(None))
        
        # 거래 유형 필터링
        if transaction_type:
            if transaction_type == 'income':
                q = q.filter(NormalizedEntry.amount > 0)
            elif transaction_type == 'expense':
                q = q.filter(NormalizedEntry.amount < 0)
        
        # 전체 개수 계산
        total = q.count()
        
        # 페이지네이션 및 정렬 (최신순)
        offset = (page - 1) * per_page
        entries = q.order_by(NormalizedEntry.id.desc()).offset(offset).limit(per_page).all()
        
        # 응답 데이터 구성
        entry_list = []
        for entry in entries:
            entry_data = {
                "id": entry.id,
                "trx_date": entry.trx_date or "",
                "vendor": entry.vendor or "",
                "transaction_type": "income" if (entry.amount or 0) > 0 else "expense",
                "amount": abs(float(entry.amount or 0)),
                "vat_amount": abs(float(entry.vat or 0)),
                "memo": entry.memo or "",
                "source": "direct_input"
            }
            entry_list.append(entry_data)
        
        return BaseResponse(
            data={
                "entries": entry_list,
                "pagination": {
                    "total": total,
                    "page": page,
                    "per_page": per_page,
                    "total_pages": (total + per_page - 1) // per_page
                }
            },
            message=f"{len(entry_list)}개의 직접 입력 거래 조회 완료"
        )
        
    except Exception as e:
        logger.error(f"직접 입력 목록 조회 오류: {e}")
        raise HTTPException(status_code=500, detail="직접 입력 목록 조회 중 오류가 발생했습니다")

@router.get("/direct/{entry_id}", response_model=BaseResponse)
def get_direct_entry(
    entry_id: int = Path(..., description="거래 ID"),
    db: Session = Depends(get_db)
):
    """특정 직접 입력 거래 조회"""
    try:
        entry = db.query(NormalizedEntry).filter(
            NormalizedEntry.id == entry_id,
            NormalizedEntry.file_id.is_(None)
        ).first()
        
        if not entry:
            raise HTTPException(status_code=404, detail="해당 거래를 찾을 수 없습니다")
        
        entry_data = {
            "id": entry.id,
            "trx_date": entry.trx_date or "",
            "vendor": entry.vendor or "",
            "transaction_type": "income" if (entry.amount or 0) > 0 else "expense",
            "amount": abs(float(entry.amount or 0)),
            "vat_amount": abs(float(entry.vat or 0)),
            "memo": entry.memo or "",
            "source": "direct_input"
        }
        
        return BaseResponse(
            data=entry_data,
            message="거래 조회 완료"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"직접 입력 조회 오류 (ID: {entry_id}): {e}")
        raise HTTPException(status_code=500, detail="거래 조회 중 오류가 발생했습니다")

@router.put("/direct/{entry_id}", response_model=BaseResponse)
def update_direct_entry(
    entry_id: int = Path(..., description="거래 ID"),
    update_data: DirectEntryUpdate = None,
    db: Session = Depends(get_db)
):
    """직접 입력 거래 수정"""
    try:
        entry = db.query(NormalizedEntry).filter(
            NormalizedEntry.id == entry_id,
            NormalizedEntry.file_id.is_(None)
        ).first()
        
        if not entry:
            raise HTTPException(status_code=404, detail="해당 거래를 찾을 수 없습니다")
        
        # 수정할 필드들 업데이트
        if update_data.trx_date is not None:
            entry.trx_date = update_data.trx_date
        if update_data.vendor is not None:
            entry.vendor = update_data.vendor
        if update_data.amount is not None and update_data.transaction_type is not None:
            entry.amount = update_data.amount if update_data.transaction_type == 'income' else -update_data.amount
        if update_data.vat_amount is not None and update_data.transaction_type is not None:
            entry.vat = update_data.vat_amount if update_data.transaction_type == 'income' else -update_data.vat_amount
        if update_data.memo is not None:
            entry.memo = update_data.memo
        
        db.commit()
        db.refresh(entry)
        
        logger.info(f"직접 입력 수정: ID={entry_id}, 거래처={entry.vendor}")
        
        return BaseResponse(
            data={
                "id": entry.id,
                "trx_date": entry.trx_date,
                "vendor": entry.vendor,
                "transaction_type": "income" if (entry.amount or 0) > 0 else "expense",
                "amount": abs(float(entry.amount or 0)),
                "vat_amount": abs(float(entry.vat or 0)),
                "memo": entry.memo,
                "source": "direct_input"
            },
            message="거래가 성공적으로 수정되었습니다"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"직접 입력 수정 오류 (ID: {entry_id}): {e}")
        raise HTTPException(status_code=500, detail="거래 수정 중 오류가 발생했습니다")

@router.delete("/direct/{entry_id}", response_model=BaseResponse)
def delete_direct_entry(
    entry_id: int = Path(..., description="거래 ID"),
    db: Session = Depends(get_db)
):
    """직접 입력 거래 삭제"""
    try:
        entry = db.query(NormalizedEntry).filter(
            NormalizedEntry.id == entry_id,
            NormalizedEntry.file_id.is_(None)
        ).first()
        
        if not entry:
            raise HTTPException(status_code=404, detail="해당 거래를 찾을 수 없습니다")
        
        vendor_name = entry.vendor
        
        # 관련 분류 정보도 삭제
        db.query(ClassifiedEntry).filter(ClassifiedEntry.entry_id == entry_id).delete()
        
        # 엔트리 삭제
        db.delete(entry)
        db.commit()
        
        logger.info(f"직접 입력 삭제: ID={entry_id}, 거래처={vendor_name}")
        
        return BaseResponse(
            data={"deleted_id": entry_id},
            message=f"{vendor_name} 거래가 성공적으로 삭제되었습니다"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"직접 입력 삭제 오류 (ID: {entry_id}): {e}")
        raise HTTPException(status_code=500, detail="거래 삭제 중 오류가 발생했습니다")

@router.get("/tax-calculation", response_model=BaseResponse)
def calculate_taxes(
    period: Optional[str] = Query(None, description="기간 필터 (YYYY-MM)"),
    db: Session = Depends(get_db)
):
    """실시간 세무 계산"""
    try:
        # 모든 엔트리 조회 (직접입력 + CSV 업로드)
        q = db.query(NormalizedEntry)
        
        if period:
            if len(period) < 4:
                raise HTTPException(status_code=400, detail="기간은 최소 YYYY 형식이어야 합니다")
            q = q.filter(NormalizedEntry.trx_date.like(f"{period}%"))
        
        entries = q.all()
        
        # 세무 계산
        total_income = Decimal('0')
        total_expense = Decimal('0')
        sales_tax = Decimal('0')  # 매출세액 (수입 거래의 VAT)
        purchase_tax = Decimal('0')  # 매입세액 (지출 거래의 VAT)
        
        for entry in entries:
            amount = Decimal(str(entry.amount or 0))
            vat = Decimal(str(entry.vat or 0))
            
            if amount > 0:  # 수입
                total_income += amount
                sales_tax += vat
            else:  # 지출
                total_expense += abs(amount)
                purchase_tax += abs(vat)
        
        # 납부세액 = 매출세액 - 매입세액
        payable_tax = sales_tax - purchase_tax
        net_profit = total_income - total_expense
        
        return BaseResponse(
            data={
                "sales_tax": float(sales_tax),
                "purchase_tax": float(purchase_tax),
                "payable_tax": float(payable_tax),
                "total_income": float(total_income),
                "total_expense": float(total_expense),
                "net_profit": float(net_profit),
                "entry_count": len(entries),
                "period": period or "전체",
                "calculation_time": datetime.utcnow().isoformat()
            },
            message="세무 계산 완료"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"세무 계산 오류: {e}")
        raise HTTPException(status_code=500, detail="세무 계산 중 오류가 발생했습니다")
