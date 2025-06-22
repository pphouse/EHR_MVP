from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Any

from ...core.database import get_db
from ...core.deps import get_current_active_user, require_role
from ...models.user import UserRole
from ...schemas.patient import (
    PatientCreate, 
    PatientUpdate, 
    PatientResponse, 
    PatientListResponse,
    PatientSearchParams
)
from ...services.patient_service import PatientService

patients_router = APIRouter()


@patients_router.post("/", response_model=PatientResponse)
def create_patient(
    patient_create: PatientCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST]))
) -> Any:
    """Create a new patient"""
    patient_service = PatientService(db)
    patient = patient_service.create_patient(patient_create)
    return patient


@patients_router.get("/", response_model=List[PatientListResponse])
def search_patients(
    patient_id: str = Query(None, description="Patient ID"),
    name: str = Query(None, description="Name search (partial match)"),
    kana: str = Query(None, description="Kana name search (partial match)"),
    phone: str = Query(None, description="Phone number"),
    date_of_birth: str = Query(None, description="Date of birth (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """Search patients with various criteria"""
    # Parse date_of_birth if provided
    parsed_dob = None
    if date_of_birth:
        try:
            from datetime import datetime
            parsed_dob = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    
    search_params = PatientSearchParams(
        patient_id=patient_id,
        name=name,
        kana=kana,
        phone=phone,
        date_of_birth=parsed_dob,
        skip=skip,
        limit=limit
    )
    
    patient_service = PatientService(db)
    patients = patient_service.search_patients(search_params)
    return patients


@patients_router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """Get patient by ID"""
    patient_service = PatientService(db)
    patient = patient_service.get_patient(patient_id)
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    return patient


@patients_router.get("/by-patient-id/{patient_id}", response_model=PatientResponse)
def get_patient_by_patient_id(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """Get patient by patient ID (medical record number)"""
    patient_service = PatientService(db)
    patient = patient_service.get_patient_by_patient_id(patient_id)
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    return patient


@patients_router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST]))
) -> Any:
    """Update patient information"""
    patient_service = PatientService(db)
    patient = patient_service.update_patient(patient_id, patient_update)
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    return patient


@patients_router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN]))
) -> Any:
    """Delete patient (soft delete)"""
    patient_service = PatientService(db)
    success = patient_service.delete_patient(patient_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    return {"message": "Patient deleted successfully"}


@patients_router.get("/search/count")
def get_patients_count(
    patient_id: str = Query(None, description="Patient ID"),
    name: str = Query(None, description="Name search (partial match)"),
    kana: str = Query(None, description="Kana name search (partial match)"),
    phone: str = Query(None, description="Phone number"),
    date_of_birth: str = Query(None, description="Date of birth (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """Get count of patients matching search criteria"""
    # Parse date_of_birth if provided
    parsed_dob = None
    if date_of_birth:
        try:
            from datetime import datetime
            parsed_dob = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    
    search_params = PatientSearchParams(
        patient_id=patient_id,
        name=name,
        kana=kana,
        phone=phone,
        date_of_birth=parsed_dob,
        skip=0,
        limit=1  # We only need count
    )
    
    patient_service = PatientService(db)
    count = patient_service.get_patients_count(search_params)
    return {"count": count}