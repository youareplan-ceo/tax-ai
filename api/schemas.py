"""
Pydantic 스키마 모델 - 강화된 API 응답/요청 구조
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any, Dict
from datetime import datetime
from decimal import Decimal

class BaseResponse(BaseModel):
    """공통 응답 구조"""
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None

class ErrorResponse(BaseResponse):
    """에러 응답"""
    success: bool = False
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class EntryResponse(BaseModel):
    """가계부 엔트리 응답"""
    id: int
    trx_date: str
    vendor: str
    amount: Decimal
    vat: Optional[Decimal] = None
    memo: Optional[str] = None
    account_code: Optional[str] = None
    tax_type: Optional[str] = None
    
    class Config:
        from_attributes = True

class EntriesListResponse(BaseResponse):
    """가계부 목록 응답"""
    data: List[EntryResponse]
    total: int = Field(default=0, description="총 항목 수")
    page: int = Field(default=1, description="현재 페이지")
    per_page: int = Field(default=50, description="페이지당 항목 수")

class UploadFileRequest(BaseModel):
    """파일 업로드 요청"""
    period: str = Field(..., description="기간 (YYYY-MM)")
    source: str = Field(default="manual", description="데이터 소스")

class ClassifyRequest(BaseModel):
    """AI 분류 요청"""
    entry_ids: List[int] = Field(..., description="분류할 엔트리 ID 목록")
    force_reclassify: bool = Field(default=False, description="재분류 강제 수행")

class TaxEstimateRequest(BaseModel):
    """세무 추정 요청"""
    period: str = Field(..., description="기간 (YYYY-MM)")
    business_type: Optional[str] = Field(default="general", description="사업 유형")
    
    @validator('period')
    def validate_period(cls, v):
        if len(v) != 7 or v[4] != '-':
            raise ValueError('기간은 YYYY-MM 형식이어야 합니다')
        return v

class SummaryResponse(BaseModel):
    """요약 통계 응답"""
    total_amount: Decimal = Field(default=0, description="총 금액")
    total_vat: Decimal = Field(default=0, description="총 부가세")
    entry_count: int = Field(default=0, description="항목 수")
    period: str = Field(..., description="조회 기간")
    categories: Dict[str, Decimal] = Field(default_factory=dict, description="카테고리별 금액")

# 직접 입력 관련 스키마
class DirectEntryRequest(BaseModel):
    """직접 입력 요청"""
    trx_date: str = Field(..., description="거래 날짜 (YYYY-MM-DD)")
    vendor: str = Field(..., min_length=1, max_length=500, description="거래처명")
    transaction_type: str = Field(..., description="거래 유형 (income/expense)")
    amount: Decimal = Field(..., gt=0, description="거래 금액")
    vat_amount: Optional[Decimal] = Field(default=0, description="부가세 금액")
    memo: Optional[str] = Field(default="", max_length=1000, description="메모")
    source: str = Field(default="direct_input", description="데이터 소스")
    
    @validator('trx_date')
    def validate_date(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('날짜는 YYYY-MM-DD 형식이어야 합니다')
    
    @validator('transaction_type')
    def validate_transaction_type(cls, v):
        if v not in ['income', 'expense']:
            raise ValueError('거래 유형은 income 또는 expense여야 합니다')
        return v

class DirectEntryUpdate(BaseModel):
    """직접 입력 수정 요청"""
    trx_date: Optional[str] = None
    vendor: Optional[str] = Field(None, min_length=1, max_length=500)
    transaction_type: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    vat_amount: Optional[Decimal] = None
    memo: Optional[str] = Field(None, max_length=1000)
    
    @validator('trx_date')
    def validate_date(cls, v):
        if v is not None:
            try:
                datetime.strptime(v, '%Y-%m-%d')
                return v
            except ValueError:
                raise ValueError('날짜는 YYYY-MM-DD 형식이어야 합니다')
        return v
    
    @validator('transaction_type')
    def validate_transaction_type(cls, v):
        if v is not None and v not in ['income', 'expense']:
            raise ValueError('거래 유형은 income 또는 expense여야 합니다')
        return v

class DirectEntryResponse(BaseModel):
    """직접 입력 응답"""
    id: int
    trx_date: str
    vendor: str
    transaction_type: str
    amount: Decimal
    vat_amount: Decimal
    memo: str
    source: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TaxCalculationResponse(BaseModel):
    """세무 계산 응답"""
    sales_tax: Decimal = Field(default=0, description="매출세액")
    purchase_tax: Decimal = Field(default=0, description="매입세액")
    payable_tax: Decimal = Field(default=0, description="납부세액")
    total_income: Decimal = Field(default=0, description="총 매출")
    total_expense: Decimal = Field(default=0, description="총 매입")
    net_profit: Decimal = Field(default=0, description="순이익")
    entry_count: int = Field(default=0, description="거래 건수")

class HealthResponse(BaseModel):
    """헬스체크 응답"""
    ok: bool = True
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = Field(default="v8")
    database: str = Field(default="ok")
    ai_service: str = Field(default="ok")