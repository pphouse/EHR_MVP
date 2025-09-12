"""
FHIR変換API
電子カルテデータのFHIR準拠変換エンドポイント
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.patient import Patient  
from app.models.encounter import Encounter
from app.models.prescription import Prescription
from app.services.fhir_converter_service_v2 import SimpleFHIRConverterService as FHIRConverterService
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter()


class FHIRConversionRequest(BaseModel):
    """FHIR変換リクエスト"""
    patient_id: int = Field(..., description="患者ID")
    encounter_id: Optional[int] = Field(None, description="診療記録ID")
    include_medical_info: bool = Field(True, description="5情報・6情報を含めるか")
    

class MedicalInfoExtractionRequest(BaseModel):
    """医療情報抽出リクエスト"""
    text: str = Field(..., description="抽出対象のテキスト")
    context: Optional[Dict[str, Any]] = Field(None, description="追加コンテキスト")


class FHIRValidationRequest(BaseModel):
    """FHIRバリデーションリクエスト"""
    fhir_bundle: Dict[str, Any] = Field(..., description="検証するFHIRバンドル")


@router.post("/convert-to-fhir")
async def convert_to_fhir(
    request: FHIRConversionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    患者・診療記録データをFHIR準拠形式に変換
    
    - 患者基本情報をFHIR Patientリソースに変換
    - 診療記録をFHIR Encounterリソースに変換
    - テキストから5情報・6情報を抽出してFHIRリソース化
    """
    try:
        # サービスの初期化
        fhir_service = FHIRConverterService()
        
        # 患者データの取得
        patient = db.query(Patient).filter(
            Patient.id == request.patient_id
        ).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        patient_data = {
            "id": patient.id,
            "patient_id": patient.patient_id,
            "family_name": patient.family_name,
            "given_name": patient.given_name,
            "gender": patient.gender,
            "birth_date": patient.birth_date.isoformat() if patient.birth_date else None,
            "phone": patient.phone
        }
        
        # 診療記録データの取得（オプション）
        encounter_data = None
        medical_text = ""
        
        if request.encounter_id:
            encounter = db.query(Encounter).filter(
                Encounter.id == request.encounter_id,
                Encounter.patient_id == request.patient_id
            ).first()
            
            if encounter:
                encounter_data = {
                    "id": encounter.id,
                    "encounter_id": encounter.encounter_id,
                    "patient_id": encounter.patient_id,
                    "status": encounter.status,
                    "encounter_class": encounter.encounter_class,
                    "start_time": encounter.start_time.isoformat() if encounter.start_time else None,
                    "end_time": encounter.end_time.isoformat() if encounter.end_time else None,
                    "chief_complaint": encounter.chief_complaint
                }
                
                # 医療テキストの結合
                medical_text_parts = []
                if encounter.chief_complaint:
                    medical_text_parts.append(f"主訴: {encounter.chief_complaint}")
                if encounter.subjective:
                    medical_text_parts.append(f"S: {encounter.subjective}")
                if encounter.objective:
                    medical_text_parts.append(f"O: {encounter.objective}")
                if encounter.assessment:
                    medical_text_parts.append(f"A: {encounter.assessment}")
                if encounter.plan:
                    medical_text_parts.append(f"P: {encounter.plan}")
                    
                medical_text = "\n".join(medical_text_parts)
        
        # FHIRバンドルの作成
        bundle = await fhir_service.create_fhir_bundle(
            patient_data=patient_data,
            encounter_data=encounter_data or {},
            medical_text=medical_text if request.include_medical_info else ""
        )
        
        # ログ記録
        logger.info(f"FHIR conversion completed for patient {request.patient_id} by user {current_user.id}")
        
        return {
            "status": "success",
            "fhir_bundle": bundle,
            "resource_count": len(bundle.get("entry", [])),
            "bundle_id": bundle.get("id")
        }
        
    except Exception as e:
        logger.error(f"FHIR conversion error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"FHIR conversion failed: {str(e)}"
        )


@router.post("/extract-medical-info")
async def extract_medical_info(
    request: MedicalInfoExtractionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    テキストから5情報・6情報を構造化抽出
    
    - 傷病名（診断）
    - アレルギー
    - 感染症
    - 薬剤禁忌
    - 検査結果
    - 処方情報
    """
    try:
        fhir_service = FHIRConverterService()
        
        # 医療情報の抽出
        extracted_info = await fhir_service.extract_medical_info(request.text)
        
        # 統計情報の追加
        stats = {
            "diagnoses_count": len(extracted_info.get("diagnoses", [])),
            "allergies_count": len(extracted_info.get("allergies", [])),
            "infections_count": len(extracted_info.get("infections", [])),
            "contraindications_count": len(extracted_info.get("contraindications", [])),
            "lab_results_count": len(extracted_info.get("labResults", [])),
            "prescriptions_count": len(extracted_info.get("prescriptions", []))
        }
        
        # AIサービスでの安全性チェック
        # Safety layer removed - process text directly
        processed_text = request.text
        
        return {
            "status": "success",
            "extracted_info": extracted_info,
            "statistics": stats,
            "processed_text": processed_text
        }
        
    except Exception as e:
        logger.error(f"Medical info extraction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Medical info extraction failed: {str(e)}"
        )


@router.post("/validate-fhir")
async def validate_fhir(
    request: FHIRValidationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    FHIRバンドルのバリデーション
    
    - 構造の妥当性チェック
    - 必須フィールドの確認
    - リソース間の参照整合性
    """
    try:
        fhir_service = FHIRConverterService()
        
        # バリデーション実行（辞書形式で直接処理）
        validation_result = await fhir_service.validate_fhir_bundle(request.fhir_bundle)
        
        return {
            "status": "success",
            "validation": validation_result,
            "bundle_type": request.fhir_bundle.get("type"),
            "resource_count": len(request.fhir_bundle.get("entry", []))
        }
        
    except Exception as e:
        logger.error(f"FHIR validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"FHIR validation failed: {str(e)}"
        )


@router.get("/fhir-status")
async def get_fhir_status(
    current_user: User = Depends(get_current_user)
):
    """
    FHIR変換サービスのステータス確認
    """
    try:
        fhir_service = FHIRConverterService()
        
        return {
            "status": "operational",
            "fhir_version": "R4",
            "supported_resources": [
                "Patient",
                "Encounter", 
                "Condition",
                "AllergyIntolerance",
                "Observation",
                "MedicationRequest"
            ],
            "extraction_features": {
                "diagnoses": True,
                "allergies": True,
                "infections": True,
                "contraindications": True,
                "lab_results": True,
                "prescriptions": True
            },
            "ai_integration": {
                "safety_layer_enabled": False
            }
        }
        
    except Exception as e:
        logger.error(f"FHIR status check error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }