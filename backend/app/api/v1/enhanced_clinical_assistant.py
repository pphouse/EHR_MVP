"""
Enhanced Clinical Assistant API
リアルタイム診療支援・状況整理・A&P整合性チェック
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.clinical_assistant_service import ClinicalAssistantService
from app.services.enhanced_pii_service import EnhancedPIIService
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter()


class ClinicalDataRequest(BaseModel):
    """リアルタイム状況整理リクエスト"""
    basic_info: Dict[str, Any] = Field(..., description="基本情報")
    vitals: Dict[str, Any] = Field(..., description="バイタルサイン")
    subjective: str = Field(..., description="主観的所見(S)")
    objective: str = Field(..., description="客観的所見(O)")
    patient_history: Optional[List[Dict[str, Any]]] = Field(None, description="既往歴")


class ClinicalValidationRequest(BaseModel):
    """A&P整合性チェックリクエスト"""
    patient_summary: str = Field(..., description="AI生成の患者状況整理")
    assessment: str = Field(..., description="医師入力のAssessment")
    plan: str = Field(..., description="医師入力のPlan")
    diagnosis_codes: Optional[List[str]] = Field(None, description="診断コード")


class EnhancedPIIRequest(BaseModel):
    """拡張PII検知リクエスト"""
    text: str = Field(..., description="検知対象テキスト")
    medical_context: bool = Field(True, description="医療文脈での検知")
    masking_level: str = Field("standard", description="minimal|standard|maximum")


@router.post("/generate-patient-summary")
async def generate_patient_summary(
    request: ClinicalDataRequest,
    current_user: User = Depends(get_current_user)
):
    """
    リアルタイム患者状況整理生成
    
    S&Oから患者の現在の状況を医学的に整理し、
    鑑別診断と推奨事項を提示
    """
    try:
        service = ClinicalAssistantService()
        
        # 患者状況整理の生成
        situation = await service.generate_patient_summary({
            'basic_info': request.basic_info,
            'vitals': request.vitals,
            'subjective': request.subjective,
            'objective': request.objective,
            'patient_history': request.patient_history or []
        })
        
        # ログ記録
        logger.info(f"Patient summary generated for user {current_user.id}")
        
        return {
            "status": "success",
            "patient_situation": {
                "summary": situation.summary,
                "key_findings": situation.key_findings,
                "differential_diagnoses": situation.differential_diagnoses,
                "risk_factors": situation.risk_factors,
                "recommendations": situation.recommendations,
                "confidence_score": situation.confidence_score,
                "generated_at": situation.generated_at.isoformat()
            },
            "usage_note": "この要約は医学的判断の補助として提供されています。最終的な診断・治療方針は医師の判断に基づいてください。"
        }
        
    except Exception as e:
        logger.error(f"Patient summary generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"患者状況整理の生成に失敗しました: {str(e)}"
        )


@router.post("/validate-clinical-reasoning")
async def validate_clinical_reasoning(
    request: ClinicalValidationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    A&P整合性チェック
    
    AI生成の状況整理と医師入力のA&Pの
    医学的整合性を検証
    """
    try:
        service = ClinicalAssistantService()
        
        # 整合性チェック実行
        validation = await service.validate_clinical_reasoning(
            patient_summary=request.patient_summary,
            assessment=request.assessment,
            plan=request.plan,
            diagnosis_codes=request.diagnosis_codes
        )
        
        # ログ記録
        logger.info(f"Clinical validation performed for user {current_user.id}, consistency: {validation.is_consistent}")
        
        return {
            "status": "success",
            "validation_result": {
                "is_consistent": validation.is_consistent,
                "consistency_score": validation.consistency_score,
                "inconsistencies": validation.inconsistencies,
                "suggestions": validation.suggestions,
                "missing_elements": validation.missing_elements,
                "validation_summary": validation.validation_summary
            },
            "recommendation": "high" if validation.consistency_score >= 0.8 else 
                             "medium" if validation.consistency_score >= 0.6 else "review_required"
        }
        
    except Exception as e:
        logger.error(f"Clinical validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"整合性チェックに失敗しました: {str(e)}"
        )


@router.post("/enhanced-pii-detection")
async def enhanced_pii_detection(
    request: EnhancedPIIRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Azure OpenAI活用PII検知
    
    文脈を理解した高精度な個人情報検知と
    適応的マスキング
    """
    try:
        service = EnhancedPIIService()
        
        # PII検知実行
        detections = await service.detect_pii_with_context(
            text=request.text,
            medical_context=request.medical_context
        )
        
        # 適応的マスキング実行
        masked_text, _ = await service.smart_masking(
            text=request.text,
            masking_level=request.masking_level
        )
        
        # リスク分析
        risk_analysis = await service.analyze_pii_risk(request.text)
        
        return {
            "status": "success",
            "original_text": request.text,
            "masked_text": masked_text,
            "masking_level": request.masking_level,
            "detections": [
                {
                    "text": d.text,
                    "type": d.pii_type,
                    "confidence": d.confidence,
                    "masked_text": d.masked_text,
                    "context": d.context,
                    "reasoning": d.reasoning
                }
                for d in detections
            ],
            "risk_analysis": risk_analysis,
            "processing_method": "azure_openai" if service.ai_service.azure_client else "regex_fallback"
        }
        
    except Exception as e:
        logger.error(f"Enhanced PII detection error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PII検知に失敗しました: {str(e)}"
        )


@router.post("/clinical-recommendations")
async def generate_clinical_recommendations(
    patient_data: Dict[str, Any],
    diagnosis: str,
    current_user: User = Depends(get_current_user)
):
    """
    診断に基づく臨床推奨事項生成
    """
    try:
        service = ClinicalAssistantService()
        
        recommendations = await service.generate_clinical_recommendations(
            patient_data=patient_data,
            diagnosis=diagnosis
        )
        
        return {
            "status": "success",
            "diagnosis": diagnosis,
            "recommendations": recommendations,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Clinical recommendations error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"臨床推奨事項の生成に失敗しました: {str(e)}"
        )


@router.get("/enhanced-clinical-status")
async def get_enhanced_clinical_status(
    current_user: User = Depends(get_current_user)
):
    """
    Enhanced Clinical Assistant サービスの状態確認
    """
    try:
        clinical_service = ClinicalAssistantService()
        pii_service = EnhancedPIIService()
        
        return {
            "status": "operational",
            "features": {
                "patient_summary_generation": True,
                "clinical_validation": True,
                "enhanced_pii_detection": True,
                "clinical_recommendations": True
            },
            "azure_openai": {
                "configured": clinical_service.ai_service.azure_client is not None,
                "deployment": clinical_service.ai_service.deployment_name,
                "api_version": clinical_service.ai_service.azure_openai_version
            },
            "masking_levels": ["minimal", "standard", "maximum"],
            "supported_pii_types": [
                "name", "patient_id", "phone", "email", 
                "address", "birth_date", "insurance_number"
            ],
            "validation_criteria": [
                "diagnosis_mismatch", "treatment_inappropriate", 
                "missing_consideration"
            ]
        }
        
    except Exception as e:
        logger.error(f"Enhanced clinical status check error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }