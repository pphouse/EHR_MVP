from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import date, datetime
from ..models.patient import Gender


class PatientBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    first_name_kana: Optional[str] = Field(None, max_length=100)
    last_name_kana: Optional[str] = Field(None, max_length=100)
    date_of_birth: date
    gender: Gender
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    postal_code: Optional[str] = Field(None, max_length=10)
    prefecture: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=100)
    address_line: Optional[str] = Field(None, max_length=255)
    insurance_type: Optional[str] = Field(None, max_length=50)
    insurance_number: Optional[str] = Field(None, max_length=50)
    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    emergency_contact_relationship: Optional[str] = Field(None, max_length=50)
    blood_type: Optional[str] = Field(None, max_length=5)
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    notes: Optional[str] = None

    @validator('date_of_birth')
    def validate_date_of_birth(cls, v):
        from datetime import date
        if v > date.today():
            raise ValueError('Date of birth cannot be in the future')
        return v


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    first_name_kana: Optional[str] = Field(None, max_length=100)
    last_name_kana: Optional[str] = Field(None, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    postal_code: Optional[str] = Field(None, max_length=10)
    prefecture: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=100)
    address_line: Optional[str] = Field(None, max_length=255)
    insurance_type: Optional[str] = Field(None, max_length=50)
    insurance_number: Optional[str] = Field(None, max_length=50)
    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    emergency_contact_relationship: Optional[str] = Field(None, max_length=50)
    blood_type: Optional[str] = Field(None, max_length=5)
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[str] = Field(None, pattern="^[01]$")


class PatientResponse(PatientBase):
    id: int
    patient_id: str
    is_active: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    full_name: Optional[str] = None
    full_name_kana: Optional[str] = None
    
    class Config:
        from_attributes = True


class PatientListResponse(BaseModel):
    id: int
    patient_id: str
    first_name: str
    last_name: str
    first_name_kana: Optional[str]
    last_name_kana: Optional[str]
    date_of_birth: date
    gender: Gender
    phone: Optional[str]
    full_name: Optional[str]
    full_name_kana: Optional[str]
    is_active: str
    
    class Config:
        from_attributes = True


class PatientSearchParams(BaseModel):
    patient_id: Optional[str] = Field(None, description="Patient ID")
    name: Optional[str] = Field(None, description="Name search (partial match)")
    kana: Optional[str] = Field(None, description="Kana name search (partial match)")
    phone: Optional[str] = Field(None, description="Phone number")
    date_of_birth: Optional[date] = Field(None, description="Date of birth")
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(100, ge=1, le=1000, description="Number of records to return")