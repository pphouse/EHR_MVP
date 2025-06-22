from sqlalchemy import Column, Integer, String, Date, DateTime, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class Gender(enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    UNKNOWN = "unknown"


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(20), unique=True, index=True, nullable=False)  # Medical record number
    
    # Personal information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    first_name_kana = Column(String(100), nullable=True)  # Japanese reading
    last_name_kana = Column(String(100), nullable=True)   # Japanese reading
    date_of_birth = Column(Date, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    
    # Contact information
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    
    # Address information
    postal_code = Column(String(10), nullable=True)
    prefecture = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    address_line = Column(String(255), nullable=True)
    
    # Insurance information
    insurance_type = Column(String(50), nullable=True)
    insurance_number = Column(String(50), nullable=True)
    
    # Emergency contact
    emergency_contact_name = Column(String(200), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    emergency_contact_relationship = Column(String(50), nullable=True)
    
    # Medical information
    blood_type = Column(String(5), nullable=True)
    allergies = Column(Text, nullable=True)
    medical_history = Column(Text, nullable=True)
    
    # System fields
    is_active = Column(String(1), default="1")  # "1" for active, "0" for inactive
    notes = Column(Text, nullable=True)
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    encounters = relationship("Encounter", back_populates="patient")
    
    def __repr__(self):
        return f"<Patient(id={self.id}, patient_id='{self.patient_id}', name='{self.last_name} {self.first_name}')>"
    
    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name}"
    
    @property
    def full_name_kana(self):
        if self.last_name_kana and self.first_name_kana:
            return f"{self.last_name_kana} {self.first_name_kana}"
        return None