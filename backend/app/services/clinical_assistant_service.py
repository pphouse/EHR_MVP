"""
Clinical Assistant Service
リアルタイム診療支援・状況整理・A&P整合性チェック
"""
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

from app.services.ai_assistant_service import AIAssistantService
from app.services.enhanced_pii_service import EnhancedPIIService

logger = logging.getLogger(__name__)


@dataclass
class PatientSituation:
    """患者状況整理結果"""
    summary: str
    key_findings: List[str]
    differential_diagnoses: List[Dict[str, Any]]
    risk_factors: List[str]
    recommendations: List[str]
    confidence_score: float
    generated_at: datetime


@dataclass
class ClinicalValidation:
    """A&P整合性チェック結果"""
    is_consistent: bool
    consistency_score: float
    inconsistencies: List[Dict[str, Any]]
    suggestions: List[str]
    missing_elements: List[str]
    validation_summary: str


class ClinicalAssistantService:
    """Azure OpenAI APIを使用したリアルタイム診療支援サービス"""
    
    def __init__(self):
        self.ai_service = AIAssistantService()
        self.pii_service = EnhancedPIIService()
    
    async def generate_patient_summary(self, clinical_data: Dict[str, Any]) -> PatientSituation:
        """
        S&Oから患者状況の自動要約生成
        
        Args:
            clinical_data: {
                'basic_info': {...},
                'vitals': {...},
                'subjective': str,
                'objective': str,
                'patient_history': [...] (optional)
            }
            
        Returns:
            PatientSituation: 生成された患者状況整理
        """
        try:
            if not self.ai_service.azure_client:
                raise Exception("Azure OpenAI client not available")
            
            # 入力データの安全性チェック
            safe_data = await self._sanitize_clinical_data(clinical_data)
            
            # 患者状況整理プロンプトの生成
            prompt = self._create_patient_summary_prompt(safe_data)
            
            messages = [
                {"role": "system", "content": "あなたは経験豊富な臨床医です。患者の現在の状況を的確に整理し、適切な医学的判断を支援してください。"},
                {"role": "user", "content": prompt}
            ]
            
            response = self.ai_service.azure_client.chat.completions.create(
                model=self.ai_service.deployment_name,
                messages=messages,
                max_tokens=1200,
                temperature=0.2
            )
            
            content = response.choices[0].message.content
            
            # JSON解析と構造化
            result = json.loads(content)
            
            situation = PatientSituation(
                summary=result.get("summary", ""),
                key_findings=result.get("key_findings", []),
                differential_diagnoses=result.get("differential_diagnoses", []),
                risk_factors=result.get("risk_factors", []),
                recommendations=result.get("recommendations", []),
                confidence_score=float(result.get("confidence_score", 0.0)),
                generated_at=datetime.now()
            )
            
            return situation
            
        except Exception as e:
            logger.error(f"Patient summary generation error: {e}")
            # エラー時はフォールバック
            return PatientSituation(
                summary="自動要約の生成に失敗しました。手動での状況整理をお願いします。",
                key_findings=[],
                differential_diagnoses=[],
                risk_factors=[],
                recommendations=["医師による詳細な評価が必要です"],
                confidence_score=0.0,
                generated_at=datetime.now()
            )
    
    def _create_patient_summary_prompt(self, clinical_data: Dict[str, Any]) -> str:
        """患者状況整理用のプロンプトを生成"""
        
        basic_info = clinical_data.get('basic_info', {})
        vitals = clinical_data.get('vitals', {})
        subjective = clinical_data.get('subjective', '')
        objective = clinical_data.get('objective', '')
        history = clinical_data.get('patient_history', [])
        
        history_text = ""
        if history:
            history_text = f"""
【既往歴・関連する過去の診療】:
{json.dumps(history, ensure_ascii=False, indent=2)}
"""
        
        return f"""
以下の患者情報から、現在の医学的状況を整理し、臨床判断を支援してください。

【基本情報】:
年齢: {basic_info.get('age', '不明')}
性別: {basic_info.get('gender', '不明')}
既往歴: {basic_info.get('medical_history', '特記事項なし')}

【バイタルサイン】:
体温: {vitals.get('temperature', '－')}°C
血圧: {vitals.get('blood_pressure_systolic', '－')}/{vitals.get('blood_pressure_diastolic', '－')} mmHg
心拍数: {vitals.get('heart_rate', '－')} bpm
呼吸数: {vitals.get('respiratory_rate', '－')} /min
酸素飽和度: {vitals.get('oxygen_saturation', '－')}%

【主観的所見(Subjective)】:
{subjective}

【客観的所見(Objective)】:
{objective}

{history_text}

【出力要求】:
以下のJSON形式で回答してください：
{{
    "summary": "患者の現在の状況を簡潔に要約（200文字以内）",
    "key_findings": [
        "重要な所見1",
        "重要な所見2",
        "重要な所見3"
    ],
    "differential_diagnoses": [
        {{
            "diagnosis": "鑑別診断1",
            "probability": 0.7,
            "supporting_evidence": ["根拠1", "根拠2"],
            "additional_tests": ["推奨検査1", "推奨検査2"]
        }}
    ],
    "risk_factors": [
        "リスク要因1",
        "リスク要因2"
    ],
    "recommendations": [
        "推奨事項1",
        "推奨事項2",
        "推奨事項3"
    ],
    "confidence_score": 0.8
}}

【重要】:
- 医学的に正確な情報のみを提供してください
- 不明な点は推測せず「要確認」と記載してください
- 緊急性がある場合は recommendations に明記してください
"""
    
    async def validate_clinical_reasoning(self, 
                                        patient_summary: str, 
                                        assessment: str, 
                                        plan: str,
                                        diagnosis_codes: List[str] = None) -> ClinicalValidation:
        """
        A&Pの医学的妥当性チェック
        
        Args:
            patient_summary: AI生成の患者状況整理
            assessment: 医師入力のAssessment
            plan: 医師入力のPlan
            diagnosis_codes: 診断コードリスト
            
        Returns:
            ClinicalValidation: 整合性チェック結果
        """
        try:
            if not self.ai_service.azure_client:
                raise Exception("Azure OpenAI client not available")
            
            # 入力データの安全性チェック
            safe_summary = await self._sanitize_text(patient_summary)
            safe_assessment = await self._sanitize_text(assessment)
            safe_plan = await self._sanitize_text(plan)
            
            # 整合性チェックプロンプトの生成
            prompt = self._create_validation_prompt(
                safe_summary, safe_assessment, safe_plan, diagnosis_codes or []
            )
            
            messages = [
                {"role": "system", "content": "あなたは医療品質管理の専門家です。臨床推論の整合性を厳密に評価してください。"},
                {"role": "user", "content": prompt}
            ]
            
            response = self.ai_service.azure_client.chat.completions.create(
                model=self.ai_service.deployment_name,
                messages=messages,
                max_tokens=1000,
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            
            validation = ClinicalValidation(
                is_consistent=result.get("is_consistent", False),
                consistency_score=float(result.get("consistency_score", 0.0)),
                inconsistencies=result.get("inconsistencies", []),
                suggestions=result.get("suggestions", []),
                missing_elements=result.get("missing_elements", []),
                validation_summary=result.get("validation_summary", "")
            )
            
            return validation
            
        except Exception as e:
            logger.error(f"Clinical validation error: {e}")
            return ClinicalValidation(
                is_consistent=False,
                consistency_score=0.0,
                inconsistencies=[{"type": "system_error", "description": "検証システムエラー"}],
                suggestions=["手動での詳細確認を推奨します"],
                missing_elements=[],
                validation_summary="自動検証に失敗しました"
            )
    
    def _create_validation_prompt(self, summary: str, assessment: str, plan: str, diagnosis_codes: List[str]) -> str:
        """A&P整合性チェック用プロンプトを生成"""
        
        codes_text = ""
        if diagnosis_codes:
            codes_text = f"診断コード: {', '.join(diagnosis_codes)}"
        
        return f"""
以下の臨床情報の整合性を評価してください。

【AI生成の状況整理】:
{summary}

【医師入力のAssessment（評価）】:
{assessment}

【医師入力のPlan（計画）】:
{plan}

{codes_text}

【評価観点】:
1. 状況整理とAssessmentの整合性
2. AssessmentとPlanの論理的整合性
3. 診断コードとAssessmentの適合性
4. Planの医学的妥当性
5. 重要な見落としの有無

【出力形式】:
{{
    "is_consistent": true/false,
    "consistency_score": 0.0から1.0,
    "inconsistencies": [
        {{
            "type": "diagnosis_mismatch|treatment_inappropriate|missing_consideration",
            "description": "不整合の詳細",
            "severity": "low|medium|high|critical",
            "location": "assessment|plan|diagnosis_code"
        }}
    ],
    "suggestions": [
        "改善提案1",
        "改善提案2"
    ],
    "missing_elements": [
        "見落とされている可能性のある要素1",
        "見落とされている可能性のある要素2"
    ],
    "validation_summary": "全体的な評価サマリー"
}}

【重要】:
- 医学的根拠に基づいて厳密に評価してください
- 軽微な表現の違いは問題としないでください
- 患者安全に関わる重要な不整合は必ず指摘してください
"""
    
    async def _sanitize_clinical_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """臨床データの安全性チェック"""
        sanitized = {}
        
        for key, value in data.items():
            if isinstance(value, str):
                # PII検知とマスキング
                masked_text, _ = await self.pii_service.smart_masking(value, "minimal")
                sanitized[key] = masked_text
            else:
                sanitized[key] = value
        
        return sanitized
    
    async def _sanitize_text(self, text: str) -> str:
        """テキストの安全性チェック"""
        if not text:
            return ""
        
        # 最小限のマスキングで処理
        masked_text, _ = await self.pii_service.smart_masking(text, "minimal")
        return masked_text
    
    async def generate_clinical_recommendations(self, 
                                              patient_data: Dict[str, Any],
                                              diagnosis: str) -> List[str]:
        """
        診断に基づく臨床推奨事項の生成
        """
        try:
            prompt = f"""
以下の患者情報と診断に基づいて、適切な治療方針と注意事項を提案してください。

【患者情報】:
{json.dumps(patient_data, ensure_ascii=False, indent=2)}

【診断】:
{diagnosis}

【出力】:
- 治療方針の推奨
- 検査・モニタリング項目
- 患者指導事項
- フォローアップ計画
- 注意すべき合併症

簡潔な箇条書きで回答してください。
"""
            
            messages = [
                {"role": "system", "content": "あなたは総合診療の専門医です。"},
                {"role": "user", "content": prompt}
            ]
            
            response = self.ai_service.azure_client.chat.completions.create(
                model=self.ai_service.deployment_name,
                messages=messages,
                max_tokens=800,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # 改行で分割して箇条書きリストを作成
            recommendations = [
                line.strip() 
                for line in content.split('\n') 
                if line.strip() and not line.strip().startswith('#')
            ]
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Clinical recommendations generation error: {e}")
            return [
                "詳細な医学的評価が必要です",
                "適切な専門医への相談を検討してください",
                "患者の状態を継続的にモニタリングしてください"
            ]