from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean
from sqlalchemy.sql import func
import enum
from ..core.database import Base


class PractitionerSpecialty(enum.Enum):
    INTERNAL_MEDICINE = "internal_medicine"
    SURGERY = "surgery"
    PEDIATRICS = "pediatrics"
    OBSTETRICS_GYNECOLOGY = "obstetrics_gynecology"
    ORTHOPEDICS = "orthopedics"
    DERMATOLOGY = "dermatology"
    PSYCHIATRY = "psychiatry"
    RADIOLOGY = "radiology"
    PATHOLOGY = "pathology"
    EMERGENCY_MEDICINE = "emergency_medicine"
    FAMILY_MEDICINE = "family_medicine"
    NURSING = "nursing"
    OTHER = "other"


class Practitioner(Base):
    __tablename__ = "practitioners"

    id = Column(Integer, primary_key=True, index=True)
    practitioner_id = Column(String(20), unique=True, index=True, nullable=False)
    
    # Personal information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    first_name_kana = Column(String(100), nullable=True)
    last_name_kana = Column(String(100), nullable=True)
    
    # Professional information
    title = Column(String(50), nullable=True)  # Dr., Nurse, etc.
    specialty = Column(Enum(PractitionerSpecialty), nullable=False)
    license_number = Column(String(50), nullable=True)
    department = Column(String(100), nullable=True)
    
    # Contact information
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    
    # System fields
    is_active = Column(Boolean, default=True)
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Practitioner(id={self.id}, name='{self.last_name} {self.first_name}', specialty='{self.specialty.value}')>"
    
    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name}"
    
    @property
    def full_name_kana(self):
        if self.last_name_kana and self.first_name_kana:
            return f"{self.last_name_kana} {self.first_name_kana}"
        return None