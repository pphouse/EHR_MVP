from typing import Optional, List
from pydantic import BaseModel, validator
from datetime import datetime
from app.models.medication import MedicationForm, MedicationCategory

class MedicationBase(BaseModel):
    """薬剤の基本スキーマ"""
    drug_code: str
    drug_name: str
    generic_name: Optional[str] = None
    brand_name: Optional[str] = None
    manufacturer: Optional[str] = None
    form: MedicationForm
    category: Optional[MedicationCategory] = None
    atc_code: Optional[str] = None
    strength: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    indications: Optional[str] = None
    contraindications: Optional[str] = None
    side_effects: Optional[str] = None
    interactions: Optional[str] = None
    standard_dosage: Optional[str] = None
    max_daily_dose: Optional[float] = None
    min_daily_dose: Optional[float] = None
    insurance_code: Optional[str] = None
    unit_price: Optional[float] = None
    is_prescription_required: bool = True
    is_controlled_substance: bool = False
    is_active: bool = True

class MedicationCreate(MedicationBase):
    """薬剤作成スキーマ"""
    pass

class MedicationUpdate(BaseModel):
    """薬剤更新スキーマ"""
    drug_name: Optional[str] = None
    generic_name: Optional[str] = None
    brand_name: Optional[str] = None
    manufacturer: Optional[str] = None
    form: Optional[MedicationForm] = None
    category: Optional[MedicationCategory] = None
    strength: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    indications: Optional[str] = None
    contraindications: Optional[str] = None
    side_effects: Optional[str] = None
    interactions: Optional[str] = None
    standard_dosage: Optional[str] = None
    max_daily_dose: Optional[float] = None
    min_daily_dose: Optional[float] = None
    unit_price: Optional[float] = None
    is_prescription_required: Optional[bool] = None
    is_controlled_substance: Optional[bool] = None
    is_active: Optional[bool] = None

class MedicationResponse(MedicationBase):
    """薬剤レスポンススキーマ"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class MedicationSearch(BaseModel):
    """薬剤検索スキーマ"""
    query: Optional[str] = None
    form: Optional[MedicationForm] = None
    category: Optional[MedicationCategory] = None
    is_prescription_required: Optional[bool] = None
    is_active: Optional[bool] = True
    limit: int = 50
    offset: int = 0

    @validator('limit')
    def validate_limit(cls, v):
        return min(v, 100)  # 最大100件まで

class MedicationListResponse(BaseModel):
    """薬剤一覧レスポンススキーマ"""
    items: List[MedicationResponse]
    total: int
    limit: int
    offset: int
    has_more: bool