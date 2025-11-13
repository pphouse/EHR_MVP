"""
Cerebras API Service
複数のLLMを使用したアンサンブル診断システム
"""
import os
import json
import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)


@dataclass
class DiagnosisResult:
    """個別LLMの診断結果"""
    model_name: str
    summary: str
    key_findings: List[str]
    differential_diagnoses: List[Dict[str, Any]]
    risk_factors: List[str]
    recommendations: List[str]
    confidence_score: float
    reasoning: str


@dataclass
class EnsembleDiagnosisResult:
    """アンサンブル診断結果"""
    final_summary: str
    final_key_findings: List[str]
    final_differential_diagnoses: List[Dict[str, Any]]
    final_risk_factors: List[str]
    final_recommendations: List[str]
    final_confidence_score: float
    individual_results: List[DiagnosisResult]
    synthesis_reasoning: str
    consensus_level: float


class CerebrasService:
    """Cerebras API統合サービス"""

    # Cerebrasで利用可能なモデル (2025年最新)
    # 検証済みのモデル名を使用
    LLAMA_31_8B = "llama3.1-8b"           # 高速・軽量モデル
    LLAMA_31_70B = "llama3.1-70b"         # バランス型モデル
    LLAMA_33_70B = "llama-3.3-70b"        # 最新の70Bモデル

    # Thinking用の最高性能モデル
    THINKING_MODEL = "llama3.1-70b"       # 最終診断統合用

    def __init__(self):
        """Cerebras APIクライアントの初期化"""
        self.api_key = os.getenv("CEREBRAS_API_KEY")

        if not self.api_key:
            logger.warning("CEREBRAS_API_KEY not found in environment variables")
            self.client = None
        else:
            try:
                # Cerebrasは OpenAI互換のAPIを提供
                self.client = OpenAI(
                    api_key=self.api_key,
                    base_url="https://api.cerebras.ai/v1"
                )
                logger.info("Cerebras API client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Cerebras client: {e}")
                self.client = None

    async def generate_diagnosis_with_model(
        self,
        model_name: str,
        prompt: str,
        system_prompt: str
    ) -> Optional[DiagnosisResult]:
        """
        個別のLLMで診断を生成

        Args:
            model_name: 使用するモデル名
            prompt: 診断用プロンプト
            system_prompt: システムプロンプト

        Returns:
            DiagnosisResult: 診断結果
        """
        if not self.client:
            logger.error("Cerebras client not available")
            return None

        try:
            logger.info(f"Generating diagnosis with {model_name}")

            # Cerebras APIで診断を生成
            response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.3
            )

            content = response.choices[0].message.content

            # JSON解析
            result = json.loads(content)

            diagnosis = DiagnosisResult(
                model_name=model_name,
                summary=result.get("summary", ""),
                key_findings=result.get("key_findings", []),
                differential_diagnoses=result.get("differential_diagnoses", []),
                risk_factors=result.get("risk_factors", []),
                recommendations=result.get("recommendations", []),
                confidence_score=float(result.get("confidence_score", 0.0)),
                reasoning=result.get("reasoning", "")
            )

            logger.info(f"Successfully generated diagnosis with {model_name}")
            return diagnosis

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error for {model_name}: {e}")
            logger.error(f"Response content: {content if 'content' in locals() else 'N/A'}")
            return None
        except Exception as e:
            logger.error(f"Error generating diagnosis with {model_name}: {e}")
            return None

    async def generate_ensemble_diagnosis(
        self,
        clinical_data: Dict[str, Any]
    ) -> EnsembleDiagnosisResult:
        """
        3つのLLMを使用したアンサンブル診断

        Args:
            clinical_data: 臨床データ

        Returns:
            EnsembleDiagnosisResult: アンサンブル診断結果
        """
        if not self.client:
            raise Exception("Cerebras client not available")

        # 診断用プロンプトの作成
        diagnosis_prompt = self._create_diagnosis_prompt(clinical_data)
        system_prompt = """あなたは経験豊富な臨床医です。患者の現在の状況を的確に整理し、適切な医学的判断を支援してください。

提示された情報を慎重に分析し、以下のJSON形式で回答してください：
{
    "summary": "患者の現在の状況を簡潔に要約（200文字以内）",
    "key_findings": ["重要な所見1", "重要な所見2", "重要な所見3"],
    "differential_diagnoses": [
        {
            "diagnosis": "鑑別診断1",
            "probability": 0.7,
            "supporting_evidence": ["根拠1", "根拠2"],
            "additional_tests": ["推奨検査1", "推奨検査2"]
        }
    ],
    "risk_factors": ["リスク要因1", "リスク要因2"],
    "recommendations": ["推奨事項1", "推奨事項2", "推奨事項3"],
    "confidence_score": 0.8,
    "reasoning": "診断の根拠となる医学的推論"
}

重要事項：
- 医学的に正確な情報のみを提供してください
- 不明な点は推測せず「要確認」と記載してください
- 緊急性がある場合は recommendations に明記してください
"""

        # 3つのLLMで並列に診断を生成
        logger.info("Generating diagnoses with 3 LLMs in parallel")

        tasks = [
            self.generate_diagnosis_with_model(
                self.LLAMA_31_8B,
                diagnosis_prompt,
                system_prompt
            ),
            self.generate_diagnosis_with_model(
                self.LLAMA_31_70B,
                diagnosis_prompt,
                system_prompt
            ),
            self.generate_diagnosis_with_model(
                self.LLAMA_33_70B,
                diagnosis_prompt,
                system_prompt
            )
        ]

        individual_results = await asyncio.gather(*tasks)

        # Noneを除外
        valid_results = [r for r in individual_results if r is not None]

        if not valid_results:
            raise Exception("All LLM diagnosis generation failed")

        logger.info(f"Generated {len(valid_results)} valid diagnoses")

        # Qwen 3 235B Thinkingで最終診断を生成
        final_diagnosis = await self._synthesize_final_diagnosis(
            valid_results,
            clinical_data
        )

        return final_diagnosis

    def _create_diagnosis_prompt(self, clinical_data: Dict[str, Any]) -> str:
        """診断用プロンプトを生成"""

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
"""

    async def _synthesize_final_diagnosis(
        self,
        individual_results: List[DiagnosisResult],
        clinical_data: Dict[str, Any]
    ) -> EnsembleDiagnosisResult:
        """
        個別診断結果を統合して最終診断を生成

        Args:
            individual_results: 各LLMの診断結果
            clinical_data: 元の臨床データ

        Returns:
            EnsembleDiagnosisResult: 最終診断結果
        """
        logger.info("Synthesizing final diagnosis with Qwen 3 235B Thinking")

        # 個別結果をテキスト形式に変換
        results_text = ""
        for idx, result in enumerate(individual_results, 1):
            results_text += f"""
=== モデル{idx}: {result.model_name} ===
信頼度スコア: {result.confidence_score}

【状況要約】:
{result.summary}

【重要所見】:
{json.dumps(result.key_findings, ensure_ascii=False, indent=2)}

【鑑別診断】:
{json.dumps(result.differential_diagnoses, ensure_ascii=False, indent=2)}

【リスク要因】:
{json.dumps(result.risk_factors, ensure_ascii=False, indent=2)}

【推奨事項】:
{json.dumps(result.recommendations, ensure_ascii=False, indent=2)}

【診断の推論】:
{result.reasoning}

"""

        # 最終診断用プロンプト
        synthesis_prompt = f"""
以下は、3つの異なる臨床AIモデルが同じ患者情報を分析した結果です。
これらの結果を統合し、最も医学的に妥当性の高い最終診断を提示してください。

【元の患者情報】:
{self._create_diagnosis_prompt(clinical_data)}

【各モデルの診断結果】:
{results_text}

【あなたのタスク】:
1. 各モデルの診断結果を批判的に評価してください
2. 共通している所見や診断に注目してください
3. 矛盾や相違点があれば、医学的根拠に基づいて判断してください
4. 最も信頼性の高い最終診断を統合してください
5. 各モデルの合意度（consensus_level: 0.0-1.0）を評価してください

【出力形式】:
以下のJSON形式で回答してください：
{{
    "final_summary": "統合された患者状況の要約",
    "final_key_findings": ["最も重要な所見1", "最も重要な所見2"],
    "final_differential_diagnoses": [
        {{
            "diagnosis": "最終鑑別診断1",
            "probability": 0.8,
            "supporting_evidence": ["統合された根拠1", "統合された根拠2"],
            "additional_tests": ["推奨検査1"],
            "model_agreement": ["モデル1", "モデル2"]
        }}
    ],
    "final_risk_factors": ["統合されたリスク要因1"],
    "final_recommendations": ["最終推奨事項1", "最終推奨事項2"],
    "final_confidence_score": 0.85,
    "synthesis_reasoning": "統合の根拠と各モデルの評価についての詳細な説明",
    "consensus_level": 0.8
}}
"""

        system_prompt = """あなたは最高レベルの臨床判断能力を持つ専門医です。
複数のAI診断システムの結果を統合し、最も医学的に妥当性の高い最終診断を提示する役割を担っています。

以下の原則に従ってください：
- 複数のモデルで一致している所見は信頼性が高い
- 矛盾がある場合は、医学的エビデンスに基づいて判断する
- 一つのモデルだけが指摘している重要な所見も見落とさない
- 患者安全を最優先に考える
- 不確実性がある場合は明確に示す
"""

        try:
            response = self.client.chat.completions.create(
                model=self.THINKING_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": synthesis_prompt}
                ],
                max_tokens=2500,
                temperature=0.2  # より保守的な温度設定
            )

            content = response.choices[0].message.content
            result = json.loads(content)

            ensemble_result = EnsembleDiagnosisResult(
                final_summary=result.get("final_summary", ""),
                final_key_findings=result.get("final_key_findings", []),
                final_differential_diagnoses=result.get("final_differential_diagnoses", []),
                final_risk_factors=result.get("final_risk_factors", []),
                final_recommendations=result.get("final_recommendations", []),
                final_confidence_score=float(result.get("final_confidence_score", 0.0)),
                individual_results=individual_results,
                synthesis_reasoning=result.get("synthesis_reasoning", ""),
                consensus_level=float(result.get("consensus_level", 0.0))
            )

            logger.info("Successfully synthesized final diagnosis")
            return ensemble_result

        except Exception as e:
            logger.error(f"Error synthesizing final diagnosis: {e}")
            # フォールバック: 最も信頼度の高い個別結果を使用
            best_result = max(individual_results, key=lambda x: x.confidence_score)

            return EnsembleDiagnosisResult(
                final_summary=best_result.summary,
                final_key_findings=best_result.key_findings,
                final_differential_diagnoses=best_result.differential_diagnoses,
                final_risk_factors=best_result.risk_factors,
                final_recommendations=best_result.recommendations,
                final_confidence_score=best_result.confidence_score,
                individual_results=individual_results,
                synthesis_reasoning="最終統合に失敗したため、最も信頼度の高い個別診断を使用",
                consensus_level=0.0
            )
