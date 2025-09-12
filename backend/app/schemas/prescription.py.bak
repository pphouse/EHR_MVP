from typing import Optional, List
from pydantic import BaseModel, validator
from datetime import datetime
from app.models.prescription import PrescriptionStatus
from app.schemas.medication import MedicationResponse
from app.schemas.patient import PatientResponse

class PrescriptionItemBase(BaseModel):
    """処方明細の基本スキーマ"""
    medication_id: int
    dosage: Optional[str] = ""
    quantity: float
    unit: Optional[str] = "tablet"
    duration_days: Optional[int] = None
    administration_route: Optional[str] = "oral"
    frequency: Optional[str] = None
    timing: Optional[str] = None
    instructions: Optional[str] = None
    is_generic_substitution_allowed: bool = True

class PrescriptionItemCreate(PrescriptionItemBase):
    """処方明細作成スキーマ"""
    pass

class PrescriptionItemUpdate(BaseModel):
    """処方明細更新スキーマ"""
    dosage: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    duration_days: Optional[int] = None
    administration_route: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[str] = None
    instructions: Optional[str] = None
    is_generic_substitution_allowed: Optional[bool] = None

class PrescriptionItemResponse(PrescriptionItemBase):
    """処方明細レスポンススキーマ"""
    id: int
    prescription_id: int
    unit_cost: Optional[float] = None
    total_cost: Optional[float] = None
    dispensed_quantity: float = 0
    dispensed_date: Optional[datetime] = None
    is_dispensed: bool = False
    medication: MedicationResponse
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PrescriptionBase(BaseModel):
    """処方箋の基本スキーマ"""
    encounter_id: int
    patient_id: int
    prescription_date: datetime
    dispensing_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    prescription_type: str = "general"
    notes: Optional[str] = None
    instructions: Optional[str] = None
    pharmacy_name: Optional[str] = None
    is_repeat_prescription: bool = False
    is_emergency: bool = False
    requires_special_handling: bool = False

class PrescriptionCreate(PrescriptionBase):
    """処方箋作成スキーマ"""
    prescription_items: List[PrescriptionItemCreate]
    
    @validator('prescription_items')
    def validate_prescription_items(cls, v):
        if not v:
            raise ValueError('処方明細は少なくとも1つ必要です')
        return v

class PrescriptionUpdate(BaseModel):
    """処方箋更新スキーマ"""
    status: Optional[PrescriptionStatus] = None
    dispensing_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None
    instructions: Optional[str] = None
    pharmacy_name: Optional[str] = None
    pharmacist_name: Optional[str] = None
    is_repeat_prescription: Optional[bool] = None
    is_emergency: Optional[bool] = None
    requires_special_handling: Optional[bool] = None

class PrescriptionResponse(PrescriptionBase):
    """処方箋レスポンススキーマ"""
    id: int
    prescription_number: Optional[str] = None
    prescriber_id: int
    status: PrescriptionStatus
    total_cost: Optional[float] = None
    insurance_coverage: Optional[float] = None
    patient_payment: Optional[float] = None
    prescription_items: List[PrescriptionItemResponse]
    patient: Optional[PatientResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PrescriptionListResponse(BaseModel):
    """処方箋一覧レスポンススキーマ"""
    items: List[PrescriptionResponse]
    total: int
    limit: int
    offset: int
    has_more: bool

class PrescriptionSearch(BaseModel):
    """処方箋検索スキーマ"""
    patient_id: Optional[int] = None
    prescriber_id: Optional[int] = None
    encounter_id: Optional[int] = None
    status: Optional[PrescriptionStatus] = None
    prescription_date_from: Optional[datetime] = None
    prescription_date_to: Optional[datetime] = None
    limit: int = 50
    offset: int = 0

    @validator('limit')
    def validate_limit(cls, v):
        return min(v, 100)  # 最大100件まで

class DispensingUpdate(BaseModel):
    """調剤更新スキーマ"""
    prescription_item_id: int
    dispensed_quantity: float
    dispensed_date: Optional[datetime] = None
    pharmacist_name: Optional[str] = None
    
    @validator('dispensed_quantity')
    def validate_dispensed_quantity(cls, v):
        if v < 0:
            raise ValueError('調剤量は0以上である必要があります')
        return v