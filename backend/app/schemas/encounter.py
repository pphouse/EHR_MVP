from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from ..models.encounter import EncounterStatus, EncounterClass


class EncounterBase(BaseModel):
    patient_id: int
    practitioner_id: int
    status: EncounterStatus = EncounterStatus.PLANNED
    encounter_class: EncounterClass = EncounterClass.AMBULATORY
    start_time: datetime
    end_time: Optional[datetime] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=35.0, le=42.0)
    blood_pressure_systolic: Optional[int] = Field(None, ge=80, le=250)
    blood_pressure_diastolic: Optional[int] = Field(None, ge=40, le=150)
    heart_rate: Optional[int] = Field(None, ge=40, le=200)
    respiratory_rate: Optional[int] = Field(None, ge=8, le=40)
    oxygen_saturation: Optional[float] = Field(None, ge=70.0, le=100.0)
    height: Optional[float] = Field(None, ge=50.0, le=250.0)
    weight: Optional[float] = Field(None, ge=20.0, le=300.0)
    chief_complaint: Optional[str] = None
    history_present_illness: Optional[str] = None
    physical_examination: Optional[str] = None
    diagnosis_codes: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('end_time')
    @classmethod
    def validate_end_time(cls, v, info):
        if v and 'start_time' in info.data and v < info.data['start_time']:
            raise ValueError('End time cannot be before start time')
        return v

    @field_validator('blood_pressure_diastolic')
    @classmethod
    def validate_blood_pressure(cls, v, info):
        if v:
            systolic = info.data.get('blood_pressure_systolic')
            if systolic and v >= systolic:
                raise ValueError('Diastolic pressure must be lower than systolic pressure')
        return v


class EncounterCreate(EncounterBase):
    pass


class EncounterUpdate(BaseModel):
    status: Optional[EncounterStatus] = None
    encounter_class: Optional[EncounterClass] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=35.0, le=42.0)
    blood_pressure_systolic: Optional[int] = Field(None, ge=80, le=250)
    blood_pressure_diastolic: Optional[int] = Field(None, ge=40, le=150)
    heart_rate: Optional[int] = Field(None, ge=40, le=200)
    respiratory_rate: Optional[int] = Field(None, ge=8, le=40)
    oxygen_saturation: Optional[float] = Field(None, ge=70.0, le=100.0)
    height: Optional[float] = Field(None, ge=50.0, le=250.0)
    weight: Optional[float] = Field(None, ge=20.0, le=300.0)
    chief_complaint: Optional[str] = None
    history_present_illness: Optional[str] = None
    physical_examination: Optional[str] = None
    diagnosis_codes: Optional[str] = None
    notes: Optional[str] = None


class EncounterResponse(EncounterBase):
    id: int
    encounter_id: str
    bmi: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class EncounterListResponse(BaseModel):
    id: int
    encounter_id: str
    patient_id: int
    practitioner_id: int
    status: EncounterStatus
    encounter_class: EncounterClass
    start_time: datetime
    end_time: Optional[datetime]
    chief_complaint: Optional[str]
    assessment: Optional[str]
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class EncounterSearchParams(BaseModel):
    patient_id: Optional[int] = Field(None, description="Patient ID")
    practitioner_id: Optional[int] = Field(None, description="Practitioner ID")
    status: Optional[EncounterStatus] = Field(None, description="Encounter status")
    encounter_class: Optional[EncounterClass] = Field(None, description="Encounter class")
    start_date: Optional[datetime] = Field(None, description="Start date filter")
    end_date: Optional[datetime] = Field(None, description="End date filter")
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(100, ge=1, le=1000, description="Number of records to return")


class VitalSignsUpdate(BaseModel):
    temperature: Optional[float] = Field(None, ge=35.0, le=42.0)
    blood_pressure_systolic: Optional[int] = Field(None, ge=80, le=250)
    blood_pressure_diastolic: Optional[int] = Field(None, ge=40, le=150)
    heart_rate: Optional[int] = Field(None, ge=40, le=200)
    respiratory_rate: Optional[int] = Field(None, ge=8, le=40)
    oxygen_saturation: Optional[float] = Field(None, ge=70.0, le=100.0)
    height: Optional[float] = Field(None, ge=50.0, le=250.0)
    weight: Optional[float] = Field(None, ge=20.0, le=300.0)


class SOAPNotesUpdate(BaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None