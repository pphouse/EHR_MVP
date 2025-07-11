from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from fastapi import HTTPException, status
from datetime import datetime
from ..models.encounter import Encounter
from ..models.patient import Patient
from ..models.user import User
from ..schemas.encounter import (
    EncounterCreate, 
    EncounterUpdate, 
    EncounterSearchParams,
    VitalSignsUpdate,
    SOAPNotesUpdate
)


class EncounterService:
    def __init__(self, db: Session):
        self.db = db

    def generate_encounter_id(self) -> str:
        """Generate unique encounter ID with robust format handling"""
        import uuid
        
        # Try multiple times to generate a unique ID
        for attempt in range(10):
            # Get all existing encounter IDs that start with 'E'
            last_encounter = (
                self.db.query(Encounter)
                .filter(Encounter.encounter_id.like("E%"))
                .order_by(Encounter.id.desc())
                .first()
            )
            
            if last_encounter and last_encounter.encounter_id:
                try:
                    # Extract numeric part from various formats: E000001, E001-001, etc.
                    encounter_id_str = last_encounter.encounter_id
                    if encounter_id_str.startswith("E"):
                        # Get all digits from the string (handles both E000001 and E001-001)
                        numeric_part = ''.join(filter(str.isdigit, encounter_id_str[1:]))
                        if numeric_part:
                            new_number = int(numeric_part) + 1
                        else:
                            new_number = 1
                    else:
                        new_number = 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
            
            # Generate new encounter ID
            new_encounter_id = f"E{new_number:06d}"
            
            # Check if this ID already exists (double-check for uniqueness)
            existing = self.db.query(Encounter).filter(
                Encounter.encounter_id == new_encounter_id
            ).first()
            
            if not existing:
                return new_encounter_id
        
        # If we still can't generate a unique ID after 10 attempts, use UUID fallback
        return f"E{uuid.uuid4().hex[:6].upper()}"

    def create_encounter(self, encounter_create: EncounterCreate) -> Encounter:
        """Create a new encounter with retry logic for ID conflicts"""
        # Verify patient exists
        patient = self.db.query(Patient).filter(
            Patient.id == encounter_create.patient_id,
            Patient.is_active == "1"
        ).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Verify practitioner exists
        practitioner = self.db.query(User).filter(
            User.id == encounter_create.practitioner_id,
            User.is_active == True
        ).first()
        if not practitioner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Practitioner not found"
            )
        
        # Retry logic for handling potential ID conflicts
        max_retries = 3
        for retry in range(max_retries):
            try:
                # Generate unique encounter ID
                encounter_id = self.generate_encounter_id()
                
                # Create encounter record
                db_encounter = Encounter(
                    encounter_id=encounter_id,
                    patient_id=encounter_create.patient_id,
                    practitioner_id=encounter_create.practitioner_id,
                    status=encounter_create.status,
                    encounter_class=encounter_create.encounter_class,
                    start_time=encounter_create.start_time,
                    end_time=encounter_create.end_time,
                    subjective=encounter_create.subjective,
                    objective=encounter_create.objective,
                    assessment=encounter_create.assessment,
                    plan=encounter_create.plan,
                    temperature=encounter_create.temperature,
                    blood_pressure_systolic=encounter_create.blood_pressure_systolic,
                    blood_pressure_diastolic=encounter_create.blood_pressure_diastolic,
                    heart_rate=encounter_create.heart_rate,
                    respiratory_rate=encounter_create.respiratory_rate,
                    oxygen_saturation=encounter_create.oxygen_saturation,
                    height=encounter_create.height,
                    weight=encounter_create.weight,
                    chief_complaint=encounter_create.chief_complaint,
                    history_present_illness=encounter_create.history_present_illness,
                    physical_examination=encounter_create.physical_examination,
                    diagnosis_codes=encounter_create.diagnosis_codes,
                    notes=encounter_create.notes
                )
                
                self.db.add(db_encounter)
                self.db.commit()
                self.db.refresh(db_encounter)
                return db_encounter
                
            except Exception as e:
                self.db.rollback()
                if "UNIQUE constraint failed" in str(e) and retry < max_retries - 1:
                    # Retry with a new ID if unique constraint failed
                    continue
                else:
                    # If it's not a unique constraint error or we've exhausted retries
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to create encounter: {str(e)}"
                    )

    def get_encounter(self, encounter_id: int) -> Optional[Encounter]:
        """Get encounter by ID"""
        return self.db.query(Encounter).filter(Encounter.id == encounter_id).first()

    def get_encounter_by_encounter_id(self, encounter_id: str) -> Optional[Encounter]:
        """Get encounter by encounter ID"""
        return self.db.query(Encounter).filter(Encounter.encounter_id == encounter_id).first()

    def update_encounter(self, encounter_id: int, encounter_update: EncounterUpdate) -> Optional[Encounter]:
        """Update encounter information"""
        db_encounter = self.get_encounter(encounter_id)
        if not db_encounter:
            return None
        
        # Update fields
        update_data = encounter_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_encounter, field, value)
        
        self.db.commit()
        self.db.refresh(db_encounter)
        return db_encounter

    def update_vital_signs(self, encounter_id: int, vital_signs: VitalSignsUpdate) -> Optional[Encounter]:
        """Update vital signs for an encounter"""
        db_encounter = self.get_encounter(encounter_id)
        if not db_encounter:
            return None
        
        # Update vital signs fields
        update_data = vital_signs.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_encounter, field, value)
        
        self.db.commit()
        self.db.refresh(db_encounter)
        return db_encounter

    def update_soap_notes(self, encounter_id: int, soap_notes: SOAPNotesUpdate) -> Optional[Encounter]:
        """Update SOAP notes for an encounter"""
        db_encounter = self.get_encounter(encounter_id)
        if not db_encounter:
            return None
        
        # Update SOAP notes fields
        update_data = soap_notes.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_encounter, field, value)
        
        self.db.commit()
        self.db.refresh(db_encounter)
        return db_encounter

    def search_encounters(self, search_params: EncounterSearchParams) -> List[Encounter]:
        """Search encounters with various criteria"""
        query = self.db.query(Encounter)
        
        # Apply filters
        if search_params.patient_id:
            query = query.filter(Encounter.patient_id == search_params.patient_id)
        
        if search_params.practitioner_id:
            query = query.filter(Encounter.practitioner_id == search_params.practitioner_id)
        
        if search_params.status:
            query = query.filter(Encounter.status == search_params.status)
        
        if search_params.encounter_class:
            query = query.filter(Encounter.encounter_class == search_params.encounter_class)
        
        if search_params.start_date:
            query = query.filter(Encounter.start_time >= search_params.start_date)
        
        if search_params.end_date:
            query = query.filter(Encounter.start_time <= search_params.end_date)
        
        # Order by most recent first
        query = query.order_by(desc(Encounter.start_time))
        
        # Apply pagination
        return (
            query.offset(search_params.skip)
            .limit(search_params.limit)
            .all()
        )

    def get_encounters_count(self, search_params: EncounterSearchParams) -> int:
        """Get total count of encounters matching search criteria"""
        query = self.db.query(Encounter)
        
        # Apply same filters as search_encounters
        if search_params.patient_id:
            query = query.filter(Encounter.patient_id == search_params.patient_id)
        
        if search_params.practitioner_id:
            query = query.filter(Encounter.practitioner_id == search_params.practitioner_id)
        
        if search_params.status:
            query = query.filter(Encounter.status == search_params.status)
        
        if search_params.encounter_class:
            query = query.filter(Encounter.encounter_class == search_params.encounter_class)
        
        if search_params.start_date:
            query = query.filter(Encounter.start_time >= search_params.start_date)
        
        if search_params.end_date:
            query = query.filter(Encounter.start_time <= search_params.end_date)
        
        return query.count()

    def get_patient_encounters(self, patient_id: int, limit: int = 50) -> List[Encounter]:
        """Get recent encounters for a specific patient"""
        return (
            self.db.query(Encounter)
            .filter(Encounter.patient_id == patient_id)
            .order_by(desc(Encounter.start_time))
            .limit(limit)
            .all()
        )

    def get_practitioner_encounters(self, practitioner_id: int, limit: int = 50) -> List[Encounter]:
        """Get recent encounters for a specific practitioner"""
        return (
            self.db.query(Encounter)
            .filter(Encounter.practitioner_id == practitioner_id)
            .order_by(desc(Encounter.start_time))
            .limit(limit)
            .all()
        )