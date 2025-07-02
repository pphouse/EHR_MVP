"""
AI Assistant API エンドポイント
Azure OpenAI APIセーフティレイヤーの制御
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import logging

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.services.ai_assistant_service import AIAssistantService, RiskLevel, SafetyAction

logger = logging.getLogger(__name__)

router = APIRouter()
ai_service = AIAssistantService()


class SafetyCheckRequest(BaseModel):
    """セーフティチェック要求"""
    text: str = Field(..., description="チェック対象のテキスト")
    context: Optional[Dict[str, Any]] = Field(None, description="コンテキスト情報")
    patient_id: Optional[int] = Field(None, description="患者ID")
    encounter_id: Optional[int] = Field(None, description="診療記録ID")


class SafetyCheckResponse(BaseModel):
    """セーフティチェック応答"""
    original_text: str
    processed_text: str
    risk_level: str
    action_taken: str
    confidence_score: float
    detected_issues: list
    processing_time_ms: int
    recommendations: list


class DiagnosisAssistRequest(BaseModel):
    """診断支援要求"""
    symptoms: list = Field(..., description="症状リスト")
    patient_context: Optional[Dict[str, Any]] = Field(None, description="患者情報")
    lab_results: Optional[Dict[str, Any]] = Field(None, description="検査結果")


class SummaryGenerationRequest(BaseModel):
    """要約生成要求"""
    encounter_data: Dict[str, Any] = Field(..., description="診療記録データ")
    summary_type: str = Field("discharge", description="要約タイプ")
    include_medications: bool = Field(True, description="薬剤情報を含むか")


@router.post("/safety-check", response_model=SafetyCheckResponse)
async def check_text_safety(
    request: SafetyCheckRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    テキストの安全性チェック
    """
    try:
        # コンテキスト情報の拡張
        context = request.context or {}
        context.update({
            "user_id": current_user.id,
            "user_role": current_user.role.value,
            "patient_id": request.patient_id,
            "encounter_id": request.encounter_id,
            "timestamp": str(datetime.now())
        })
        
        # セーフティチェック実行
        result = await ai_service.process_medical_text(request.text, context)
        
        # 推奨事項生成
        recommendations = _generate_recommendations(result)
        
        # 高リスクの場合は管理者に通知
        if result.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            background_tasks.add_task(_notify_high_risk_detection, result, current_user)
        
        return SafetyCheckResponse(
            original_text=result.original_text,
            processed_text=result.processed_text,
            risk_level=result.risk_level.value,
            action_taken=result.action_taken.value,
            confidence_score=result.confidence_score,
            detected_issues=result.detected_issues,
            processing_time_ms=result.processing_time_ms,
            recommendations=recommendations
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"セーフティチェックエラー: {str(e)}")


@router.post("/diagnosis-assist")
async def assist_diagnosis(
    request: DiagnosisAssistRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI診断支援
    """
    # 医師・管理者のみアクセス可能
    if current_user.role.value not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="診断支援機能へのアクセス権限がありません")
    
    try:
        # 症状テキストの構築
        symptoms_text = "患者の症状: " + ", ".join(request.symptoms)
        
        # 患者コンテキストの追加
        if request.patient_context:
            context_text = f"\n患者情報: {request.patient_context}"
            symptoms_text += context_text
        
        # 検査結果の追加
        if request.lab_results:
            lab_text = f"\n検査結果: {request.lab_results}"
            symptoms_text += lab_text
        
        # セーフティチェック付きで診断支援実行
        safety_result = await ai_service.process_medical_text(
            symptoms_text, 
            {"operation": "diagnosis_assist", "user_id": current_user.id}
        )
        
        # 診断候補生成（モック実装）
        differential_diagnoses = await _generate_differential_diagnoses(
            safety_result.processed_text, request.patient_context
        )
        
        return {
            "symptoms_processed": safety_result.processed_text,
            "safety_status": {
                "risk_level": safety_result.risk_level.value,
                "confidence": safety_result.confidence_score
            },
            "differential_diagnoses": differential_diagnoses,
            "recommendations": [
                "提示された診断候補は参考情報です",
                "最終診断は医師の総合的判断により決定してください",
                "追加の検査が必要な場合があります"
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"診断支援エラー: {str(e)}")


@router.post("/generate-summary")
async def generate_medical_summary(
    request: SummaryGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    医療要約生成（退院サマリー等）
    """
    # 医師・管理者のみアクセス可能
    if current_user.role.value not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="要約生成機能へのアクセス権限がありません")
    
    try:
        # 診療データからテキスト構築
        encounter_text = _build_encounter_text(request.encounter_data, request.include_medications)
        
        # セーフティチェック付きで要約生成
        safety_result = await ai_service.process_medical_text(
            encounter_text,
            {
                "operation": "summary_generation",
                "summary_type": request.summary_type,
                "user_id": current_user.id
            }
        )
        
        # 構造化要約生成
        structured_summary = await _generate_structured_summary(
            safety_result.processed_text, request.summary_type
        )
        
        return {
            "summary": structured_summary,
            "safety_status": {
                "risk_level": safety_result.risk_level.value,
                "action_taken": safety_result.action_taken.value,
                "confidence": safety_result.confidence_score
            },
            "metadata": {
                "generated_at": str(datetime.now()),
                "generated_by": current_user.full_name,
                "summary_type": request.summary_type,
                "processing_time_ms": safety_result.processing_time_ms
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"要約生成エラー: {str(e)}")


@router.get("/safety-status")
async def get_safety_layer_status(
    current_user: User = Depends(get_current_user)
):
    """
    セーフティレイヤーの状態取得
    """
    try:
        status = await ai_service.get_safety_status()
        
        return {
            "safety_layer": status,
            "user_permissions": {
                "can_use_diagnosis_assist": current_user.role.value in ["doctor", "admin"],
                "can_generate_summary": current_user.role.value in ["doctor", "admin"],
                "can_view_audit_logs": current_user.role.value == "admin"
            },
            "system_health": {
                "status": "operational" if status["azure_openai_configured"] else "degraded",
                "last_check": str(datetime.now())
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"状態取得エラー: {str(e)}")


@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    risk_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    監査ログ取得（管理者のみ）
    """
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="監査ログへのアクセス権限がありません")
    
    # TODO: 実際の監査ログDB実装
    mock_logs = [
        {
            "id": 1,
            "timestamp": "2025-06-29T21:30:00",
            "user_id": current_user.id,
            "operation": "safety_check",
            "risk_level": "medium",
            "action_taken": "mask",
            "issues_detected": 2
        }
    ]
    
    return {
        "logs": mock_logs,
        "total": len(mock_logs),
        "filters": {
            "risk_level": risk_level,
            "limit": limit
        }
    }


# ヘルパー関数
def _generate_recommendations(result) -> list:
    """推奨事項生成"""
    recommendations = []
    
    if result.risk_level == RiskLevel.CRITICAL:
        recommendations.append("このテキストは高リスクです。使用前に管理者の確認が必要です。")
    elif result.risk_level == RiskLevel.HIGH:
        recommendations.append("内容を再確認し、必要に応じて修正してください。")
    
    for issue in result.detected_issues:
        if issue["type"] == "pii_detected":
            recommendations.append(f"個人情報（{issue['category']}）が検出されました。")
        elif issue["type"] == "hallucination_risk":
            recommendations.append("医学的事実に疑問があります。信頼できる情報源で確認してください。")
    
    if not recommendations:
        recommendations.append("テキストは安全です。")
    
    return recommendations


async def _notify_high_risk_detection(result, user):
    """高リスク検知時の通知"""
    # TODO: 実際の通知システム実装
    logger.warning(f"High risk detected by user {user.id}: {result.risk_level}")


async def _generate_differential_diagnoses(symptoms_text: str, patient_context: dict) -> list:
    """鑑別診断生成（モック実装）"""
    # TODO: 実際のAI診断支援実装
    return [
        {
            "diagnosis": "上気道炎",
            "probability": 0.7,
            "reasoning": "発熱、咳嗽の症状から",
            "recommended_tests": ["血液検査", "胸部X線"]
        },
        {
            "diagnosis": "インフルエンザ",
            "probability": 0.4,
            "reasoning": "季節性と症状の組み合わせ",
            "recommended_tests": ["インフルエンザ迅速検査"]
        }
    ]


def _build_encounter_text(encounter_data: dict, include_medications: bool) -> str:
    """診療記録データからテキスト構築"""
    text_parts = []
    
    if "chief_complaint" in encounter_data:
        text_parts.append(f"主訴: {encounter_data['chief_complaint']}")
    
    if "history" in encounter_data:
        text_parts.append(f"現病歴: {encounter_data['history']}")
    
    if "physical_exam" in encounter_data:
        text_parts.append(f"身体所見: {encounter_data['physical_exam']}")
    
    if "assessment" in encounter_data:
        text_parts.append(f"評価: {encounter_data['assessment']}")
    
    if "plan" in encounter_data:
        text_parts.append(f"計画: {encounter_data['plan']}")
    
    if include_medications and "medications" in encounter_data:
        text_parts.append(f"処方: {encounter_data['medications']}")
    
    return "\n".join(text_parts)


async def _generate_structured_summary(text: str, summary_type: str) -> dict:
    """構造化要約生成（モック実装）"""
    # TODO: 実際のAI要約生成実装
    return {
        "summary_type": summary_type,
        "sections": {
            "chief_complaint": "発熱、咳嗽",
            "diagnosis": "上気道炎",
            "treatment": "対症療法",
            "outcome": "症状改善",
            "follow_up": "1週間後再診"
        },
        "keywords": ["発熱", "咳嗽", "上気道炎"],
        "length": len(text)
    }


# datetime import
from datetime import datetime