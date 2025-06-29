from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class EncounterStatus(enum.Enum):
    PLANNED = "planned"
    ARRIVED = "arrived"
    IN_PROGRESS = "in-progress"
    ONLEAVE = "onleave"
    FINISHED = "finished"
    CANCELLED = "cancelled"


class EncounterClass(enum.Enum):
    AMBULATORY = "ambulatory"  # Outpatient
    EMERGENCY = "emergency"
    INPATIENT = "inpatient"
    HOME_HEALTH = "home"
    VIRTUAL = "virtual"


class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(Integer, primary_key=True, index=True)
    encounter_id = Column(String(20), unique=True, index=True, nullable=False)
    
    # Foreign keys
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    practitioner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Encounter details
    status = Column(Enum(EncounterStatus), nullable=False, default=EncounterStatus.PLANNED)
    encounter_class = Column(Enum(EncounterClass), nullable=False, default=EncounterClass.AMBULATORY)
    
    # Timing
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    # SOAP Notes
    subjective = Column(Text, nullable=True)  # Patient's complaints, symptoms
    objective = Column(Text, nullable=True)   # Physical examination, vital signs
    assessment = Column(Text, nullable=True)  # Diagnosis
    plan = Column(Text, nullable=True)        # Treatment plan
    
    # Vital Signs
    temperature = Column(Float, nullable=True)  # Celsius
    blood_pressure_systolic = Column(Integer, nullable=True)  # mmHg
    blood_pressure_diastolic = Column(Integer, nullable=True)  # mmHg
    heart_rate = Column(Integer, nullable=True)  # bpm
    respiratory_rate = Column(Integer, nullable=True)  # breaths per minute
    oxygen_saturation = Column(Float, nullable=True)  # percentage
    height = Column(Float, nullable=True)  # cm
    weight = Column(Float, nullable=True)  # kg
    
    # Additional information
    chief_complaint = Column(Text, nullable=True)
    history_present_illness = Column(Text, nullable=True)
    physical_examination = Column(Text, nullable=True)
    diagnosis_codes = Column(Text, nullable=True)  # ICD-10 codes as JSON
    
    # System fields
    notes = Column(Text, nullable=True)
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="encounters")
    practitioner = relationship("User", back_populates="encounters")
    prescriptions = relationship("Prescription", back_populates="encounter", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Encounter(id={self.id}, encounter_id='{self.encounter_id}', patient_id={self.patient_id})>"
    
    @property
    def bmi(self):
        """Calculate BMI if height and weight are available"""
        if self.height and self.weight and self.height > 0:
            height_m = self.height / 100  # Convert cm to meters
            return round(self.weight / (height_m ** 2), 2)
        return None