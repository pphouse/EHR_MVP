from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
from datetime import datetime
from ..models.patient import Patient
from ..schemas.patient import PatientCreate, PatientUpdate, PatientSearchParams


class PatientService:
    def __init__(self, db: Session):
        self.db = db

    def generate_patient_id(self) -> str:
        """Generate unique patient ID"""
        # Get the latest patient ID and increment
        last_patient = (
            self.db.query(Patient)
            .order_by(Patient.id.desc())
            .first()
        )
        
        if last_patient and last_patient.patient_id:
            try:
                # Extract number from patient ID (assuming format P000001)
                last_number = int(last_patient.patient_id[1:])
                new_number = last_number + 1
            except (ValueError, IndexError):
                new_number = 1
        else:
            new_number = 1
        
        return f"P{new_number:06d}"

    def create_patient(self, patient_create: PatientCreate) -> Patient:
        """Create a new patient"""
        # Generate unique patient ID
        patient_id = self.generate_patient_id()
        
        # Create patient record
        db_patient = Patient(
            patient_id=patient_id,
            first_name=patient_create.first_name,
            last_name=patient_create.last_name,
            first_name_kana=patient_create.first_name_kana,
            last_name_kana=patient_create.last_name_kana,
            date_of_birth=patient_create.date_of_birth,
            gender=patient_create.gender,
            phone=patient_create.phone,
            email=patient_create.email,
            postal_code=patient_create.postal_code,
            prefecture=patient_create.prefecture,
            city=patient_create.city,
            address_line=patient_create.address_line,
            insurance_type=patient_create.insurance_type,
            insurance_number=patient_create.insurance_number,
            emergency_contact_name=patient_create.emergency_contact_name,
            emergency_contact_phone=patient_create.emergency_contact_phone,
            emergency_contact_relationship=patient_create.emergency_contact_relationship,
            blood_type=patient_create.blood_type,
            allergies=patient_create.allergies,
            medical_history=patient_create.medical_history,
            notes=patient_create.notes,
            is_active="1"
        )
        
        self.db.add(db_patient)
        self.db.commit()
        self.db.refresh(db_patient)
        return db_patient

    def get_patient(self, patient_id: int) -> Optional[Patient]:
        """Get patient by ID"""
        return (
            self.db.query(Patient)
            .filter(Patient.id == patient_id, Patient.is_active == "1")
            .first()
        )

    def get_patient_by_patient_id(self, patient_id: str) -> Optional[Patient]:
        """Get patient by patient ID (medical record number)"""
        return (
            self.db.query(Patient)
            .filter(Patient.patient_id == patient_id, Patient.is_active == "1")
            .first()
        )

    def update_patient(self, patient_id: int, patient_update: PatientUpdate) -> Optional[Patient]:
        """Update patient information"""
        db_patient = self.get_patient(patient_id)
        if not db_patient:
            return None
        
        # Update fields
        update_data = patient_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_patient, field, value)
        
        self.db.commit()
        self.db.refresh(db_patient)
        return db_patient

    def delete_patient(self, patient_id: int) -> bool:
        """Soft delete patient (set is_active to '0')"""
        db_patient = self.get_patient(patient_id)
        if not db_patient:
            return False
        
        db_patient.is_active = "0"
        self.db.commit()
        return True

    def search_patients(self, search_params: PatientSearchParams) -> List[Patient]:
        """Search patients with various criteria"""
        query = self.db.query(Patient).filter(Patient.is_active == "1")
        
        # Apply filters
        if search_params.patient_id:
            query = query.filter(Patient.patient_id.ilike(f"%{search_params.patient_id}%"))
        
        if search_params.name:
            name_filter = or_(
                Patient.first_name.ilike(f"%{search_params.name}%"),
                Patient.last_name.ilike(f"%{search_params.name}%")
            )
            query = query.filter(name_filter)
        
        if search_params.kana:
            kana_filter = or_(
                Patient.first_name_kana.ilike(f"%{search_params.kana}%"),
                Patient.last_name_kana.ilike(f"%{search_params.kana}%")
            )
            query = query.filter(kana_filter)
        
        if search_params.phone:
            query = query.filter(Patient.phone.ilike(f"%{search_params.phone}%"))
        
        if search_params.date_of_birth:
            query = query.filter(Patient.date_of_birth == search_params.date_of_birth)
        
        # Apply pagination
        return (
            query.offset(search_params.skip)
            .limit(search_params.limit)
            .all()
        )

    def get_patients_count(self, search_params: PatientSearchParams) -> int:
        """Get total count of patients matching search criteria"""
        query = self.db.query(Patient).filter(Patient.is_active == "1")
        
        # Apply same filters as search_patients
        if search_params.patient_id:
            query = query.filter(Patient.patient_id.ilike(f"%{search_params.patient_id}%"))
        
        if search_params.name:
            name_filter = or_(
                Patient.first_name.ilike(f"%{search_params.name}%"),
                Patient.last_name.ilike(f"%{search_params.name}%")
            )
            query = query.filter(name_filter)
        
        if search_params.kana:
            kana_filter = or_(
                Patient.first_name_kana.ilike(f"%{search_params.kana}%"),
                Patient.last_name_kana.ilike(f"%{search_params.kana}%")
            )
            query = query.filter(kana_filter)
        
        if search_params.phone:
            query = query.filter(Patient.phone.ilike(f"%{search_params.phone}%"))
        
        if search_params.date_of_birth:
            query = query.filter(Patient.date_of_birth == search_params.date_of_birth)
        
        return query.count()