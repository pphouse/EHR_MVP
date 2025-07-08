"""
FHIR API エンドポイント
Azure API for FHIR との統合
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session, joinedload
import json

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.encounter import Encounter
from app.models.prescription import Prescription
from app.services.fhir_service import FHIRService

router = APIRouter()
fhir_service = FHIRService()


@router.get("/Patient", response_model=Dict[str, Any])
def get_fhir_patients(
    limit: int = Query(50, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    FHIR形式で患者一覧を取得
    """
    # 患者データを取得
    patients = db.query(Patient).offset(offset).limit(limit).all()
    
    # FHIR Patientリソースに変換
    fhir_patients = [fhir_service.patient_to_fhir(p) for p in patients]
    
    # FHIR Bundle形式で返却
    bundle = fhir_service.create_bundle(fhir_patients, bundle_type="searchset")
    
    return bundle


@router.get("/Patient/{patient_id}", response_model=Dict[str, Any])
def get_fhir_patient(
    patient_id: int = Path(..., description="患者ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    指定した患者のFHIR形式データを取得
    """
    # 患者データを取得
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="患者が見つかりません")
    
    # FHIR Patientリソースに変換
    fhir_patient = fhir_service.patient_to_fhir(patient)
    
    return fhir_patient


@router.get("/Practitioner", response_model=Dict[str, Any])
def get_fhir_practitioners(
    limit: int = Query(50, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    FHIR形式で医療従事者一覧を取得
    """
    # ユーザー（医療従事者）データを取得
    practitioners = db.query(User).filter(User.is_active == True).offset(offset).limit(limit).all()
    
    # FHIR Practitionerリソースに変換
    fhir_practitioners = [fhir_service.practitioner_to_fhir(p) for p in practitioners]
    
    # FHIR Bundle形式で返却
    bundle = fhir_service.create_bundle(fhir_practitioners, bundle_type="searchset")
    
    return bundle


@router.get("/Encounter", response_model=Dict[str, Any])
def get_fhir_encounters(
    patient_id: Optional[int] = Query(None, description="患者IDで絞り込み"),
    limit: int = Query(50, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    FHIR形式で診療記録一覧を取得
    """
    # 診療記録データを取得
    query = db.query(Encounter).options(
        joinedload(Encounter.patient),
        joinedload(Encounter.provider)
    )
    
    if patient_id:
        query = query.filter(Encounter.patient_id == patient_id)
    
    encounters = query.offset(offset).limit(limit).all()
    
    # FHIR Encounterリソースに変換
    fhir_encounters = [fhir_service.encounter_to_fhir(e, db) for e in encounters]
    
    # FHIR Bundle形式で返却
    bundle = fhir_service.create_bundle(fhir_encounters, bundle_type="searchset")
    
    return bundle


@router.get("/MedicationRequest", response_model=Dict[str, Any])
def get_fhir_medication_requests(
    patient_id: Optional[int] = Query(None, description="患者IDで絞り込み"),
    encounter_id: Optional[int] = Query(None, description="診療記録IDで絞り込み"),
    limit: int = Query(50, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    FHIR形式で処方箋一覧を取得
    """
    # 処方箋データを取得
    query = db.query(Prescription).options(
        joinedload(Prescription.patient),
        joinedload(Prescription.prescriber),
        joinedload(Prescription.prescription_items).joinedload(Prescription.prescription_items.medication)
    )
    
    if patient_id:
        query = query.filter(Prescription.patient_id == patient_id)
    
    if encounter_id:
        query = query.filter(Prescription.encounter_id == encounter_id)
    
    prescriptions = query.offset(offset).limit(limit).all()
    
    # FHIR MedicationRequestリソースに変換
    all_medication_requests = []
    for prescription in prescriptions:
        medication_requests = fhir_service.prescription_to_fhir(prescription, db)
        all_medication_requests.extend(medication_requests)
    
    # FHIR Bundle形式で返却
    bundle = fhir_service.create_bundle(all_medication_requests, bundle_type="searchset")
    
    return bundle


@router.get("/Patient/{patient_id}/$everything", response_model=Dict[str, Any])
def get_patient_everything(
    patient_id: int = Path(..., description="患者ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    患者に関連するすべてのFHIRリソースを取得 ($everything operation)
    """
    # 患者データを取得
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="患者が見つかりません")
    
    # 関連するすべてのデータを取得
    encounters = db.query(Encounter).filter(Encounter.patient_id == patient_id).all()
    prescriptions = db.query(Prescription).options(
        joinedload(Prescription.prescription_items).joinedload(Prescription.prescription_items.medication)
    ).filter(Prescription.patient_id == patient_id).all()
    
    # FHIRリソースに変換
    fhir_resources = []
    
    # 患者
    fhir_patient = fhir_service.patient_to_fhir(patient)
    fhir_resources.append(fhir_patient)
    
    # 診療記録
    for encounter in encounters:
        fhir_encounter = fhir_service.encounter_to_fhir(encounter, db)
        fhir_resources.append(fhir_encounter)
    
    # 処方箋
    for prescription in prescriptions:
        medication_requests = fhir_service.prescription_to_fhir(prescription, db)
        fhir_resources.extend(medication_requests)
    
    # FHIR Bundle形式で返却
    bundle = fhir_service.create_bundle(fhir_resources, bundle_type="document")
    
    return bundle


@router.post("/upload", response_model=Dict[str, Any])
async def upload_to_azure_fhir(
    resource_type: str = Query(..., description="FHIRリソースタイプ"),
    resource_id: int = Query(..., description="リソースID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    指定したリソースをAzure API for FHIRにアップロード
    """
    # 管理者のみアップロード可能
    if current_user.role.value not in ["admin"]:
        raise HTTPException(status_code=403, detail="アップロード権限がありません")
    
    # リソースタイプに応じてデータを取得・変換
    if resource_type == "Patient":
        patient = db.query(Patient).filter(Patient.id == resource_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="患者が見つかりません")
        fhir_resource = fhir_service.patient_to_fhir(patient)
    
    elif resource_type == "Encounter":
        encounter = db.query(Encounter).filter(Encounter.id == resource_id).first()
        if not encounter:
            raise HTTPException(status_code=404, detail="診療記録が見つかりません")
        fhir_resource = fhir_service.encounter_to_fhir(encounter, db)
    
    else:
        raise HTTPException(status_code=400, detail="サポートされていないリソースタイプです")
    
    # Azure API for FHIRにアップロード
    result = await fhir_service.upload_to_fhir_server(fhir_resource)
    
    return {
        "message": "FHIRリソースをアップロードしました",
        "resource_type": resource_type,
        "resource_id": resource_id,
        "fhir_result": result
    }


@router.get("/validate/{resource_type}/{resource_id}", response_model=Dict[str, Any])
def validate_fhir_resource(
    resource_type: str = Path(..., description="FHIRリソースタイプ"),
    resource_id: int = Path(..., description="リソースID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    指定したリソースのFHIR形式バリデーション
    """
    # リソースタイプに応じてデータを取得・変換
    if resource_type == "Patient":
        patient = db.query(Patient).filter(Patient.id == resource_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="患者が見つかりません")
        fhir_resource = fhir_service.patient_to_fhir(patient)
    
    elif resource_type == "Encounter":
        encounter = db.query(Encounter).filter(Encounter.id == resource_id).first()
        if not encounter:
            raise HTTPException(status_code=404, detail="診療記録が見つかりません")
        fhir_resource = fhir_service.encounter_to_fhir(encounter, db)
    
    else:
        raise HTTPException(status_code=400, detail="サポートされていないリソースタイプです")
    
    # バリデーション実行
    is_valid = fhir_service.validate_fhir_resource(fhir_resource)
    
    return {
        "resource_type": resource_type,
        "resource_id": resource_id,
        "is_valid": is_valid,
        "fhir_json": fhir_resource if is_valid else None
    }