from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from datetime import datetime

from ...core.database import get_db
from ...core.deps import get_current_active_user, require_role
from ...models.user import UserRole
from ...models.encounter import EncounterStatus, EncounterClass
from ...schemas.encounter import (
    EncounterCreate,
    EncounterUpdate,
    EncounterResponse,
    EncounterListResponse,
    EncounterSearchParams,
    VitalSignsUpdate,
    SOAPNotesUpdate
)
from ...services.encounter_service import EncounterService

encounters_router = APIRouter()


@encounters_router.post("/", response_model=EncounterResponse)
def create_encounter(
    encounter_create: EncounterCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE]))
) -> Any:
    """Create a new encounter"""
    encounter_service = EncounterService(db)
    encounter = encounter_service.create_encounter(encounter_create)
    return encounter


@encounters_router.get("/", response_model=List[EncounterListResponse])
def search_encounters(
    patient_id: Optional[int] = Query(None, description="Patient ID"),
    practitioner_id: Optional[int] = Query(None, description="Practitioner ID"),
    status: Optional[EncounterStatus] = Query(None, description="Encounter status"),
    encounter_class: Optional[EncounterClass] = Query(None, description="Encounter class"),
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """Search encounters with various criteria"""
    # Parse dates if provided
    parsed_start_date = None
    parsed_end_date = None
    
    if start_date:
        try:
            parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start_date format. Use YYYY-MM-DD"
            )
    
    if end_date:
        try:
            parsed_end_date = datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid end_date format. Use YYYY-MM-DD"
            )
    
    search_params = EncounterSearchParams(
        patient_id=patient_id,
        practitioner_id=practitioner_id,
        status=status,
        encounter_class=encounter_class,
        start_date=parsed_start_date,
        end_date=parsed_end_date,
        skip=skip,
        limit=limit
    )
    
    encounter_service = EncounterService(db)
    encounters = encounter_service.search_encounters(search_params)
    return encounters


@encounters_router.get("/{encounter_id}", response_model=EncounterResponse)
def get_encounter(
    encounter_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """Get encounter by ID"""
    encounter_service = EncounterService(db)
    encounter = encounter_service.get_encounter(encounter_id)
    
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encounter not found"
        )
    
    return encounter


@encounters_router.get("/by-encounter-id/{encounter_id}", response_model=EncounterResponse)
def get_encounter_by_encounter_id(
    encounter_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """Get encounter by encounter ID"""
    encounter_service = EncounterService(db)
    encounter = encounter_service.get_encounter_by_encounter_id(encounter_id)
    
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encounter not found"
        )
    
    return encounter


@encounters_router.put("/{encounter_id}", response_model=EncounterResponse)
def update_encounter(
    encounter_id: int,
    encounter_update: EncounterUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE]))
) -> Any:
    """Update encounter information"""
    encounter_service = EncounterService(db)
    encounter = encounter_service.update_encounter(encounter_id, encounter_update)
    
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encounter not found"
        )
    
    return encounter


@encounters_router.patch("/{encounter_id}/vital-signs", response_model=EncounterResponse)
def update_vital_signs(
    encounter_id: int,
    vital_signs: VitalSignsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE]))
) -> Any:
    """Update vital signs for an encounter"""
    encounter_service = EncounterService(db)
    encounter = encounter_service.update_vital_signs(encounter_id, vital_signs)
    
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encounter not found"
        )
    
    return encounter


@encounters_router.patch("/{encounter_id}/soap-notes", response_model=EncounterResponse)
def update_soap_notes(
    encounter_id: int,
    soap_notes: SOAPNotesUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE]))
) -> Any:
    """Update SOAP notes for an encounter"""
    encounter_service = EncounterService(db)
    encounter = encounter_service.update_soap_notes(encounter_id, soap_notes)
    
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encounter not found"
        )
    
    return encounter


@encounters_router.get("/patient/{patient_id}", response_model=List[EncounterListResponse])
def get_patient_encounters(
    patient_id: int,
    limit: int = Query(50, ge=1, le=500, description="Number of recent encounters to return"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """Get recent encounters for a specific patient"""
    encounter_service = EncounterService(db)
    encounters = encounter_service.get_patient_encounters(patient_id, limit)
    return encounters


@encounters_router.get("/practitioner/{practitioner_id}", response_model=List[EncounterListResponse])
def get_practitioner_encounters(
    practitioner_id: int,
    limit: int = Query(50, ge=1, le=500, description="Number of recent encounters to return"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """Get recent encounters for a specific practitioner"""
    encounter_service = EncounterService(db)
    encounters = encounter_service.get_practitioner_encounters(practitioner_id, limit)
    return encounters


@encounters_router.get("/search/count")
def get_encounters_count(
    patient_id: Optional[int] = Query(None, description="Patient ID"),
    practitioner_id: Optional[int] = Query(None, description="Practitioner ID"),
    status: Optional[EncounterStatus] = Query(None, description="Encounter status"),
    encounter_class: Optional[EncounterClass] = Query(None, description="Encounter class"),
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """Get count of encounters matching search criteria"""
    # Parse dates if provided
    parsed_start_date = None
    parsed_end_date = None
    
    if start_date:
        try:
            parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start_date format. Use YYYY-MM-DD"
            )
    
    if end_date:
        try:
            parsed_end_date = datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid end_date format. Use YYYY-MM-DD"
            )
    
    search_params = EncounterSearchParams(
        patient_id=patient_id,
        practitioner_id=practitioner_id,
        status=status,
        encounter_class=encounter_class,
        start_date=parsed_start_date,
        end_date=parsed_end_date,
        skip=0,
        limit=1  # We only need count
    )
    
    encounter_service = EncounterService(db)
    count = encounter_service.get_encounters_count(search_params)
    return {"count": count}