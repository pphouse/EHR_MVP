"""
Enhanced PII Detection Service
Azure OpenAIを使用した高度な個人情報検知・マスキング
"""
import json
import re
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import logging

from app.services.ai_assistant_service import AIAssistantService

logger = logging.getLogger(__name__)


@dataclass
class EnhancedPIIDetection:
    """拡張PII検知結果"""
    text: str
    start_pos: int
    end_pos: int
    pii_type: str
    confidence: float
    masked_text: str
    context: str
    reasoning: str


class EnhancedPIIService:
    """Azure OpenAI APIを使用した高度なPII検知サービス"""
    
    def __init__(self):
        self.ai_service = AIAssistantService()
        
        # 従来の正規表現パターン（フォールバック用）
        self.fallback_patterns = {
            "patient_id": r"患者番号[：:\s]*([0-9A-Za-z\-]{6,20})",
            "phone": r"(0[0-9]{1,4}-[0-9]{1,4}-[0-9]{3,4}|0[0-9]{9,11})",
            "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
            "address": r"〒?[0-9]{3}-?[0-9]{4}.+?(市|区|町|村)",
            "name": r"(田中|佐藤|高橋|山田|渡辺|伊藤|中村|小林|山本|加藤)[　\s]*[一二三四五六七八九十太郎次郎花子美子愛子][一二三四五六七八九十郎子美愛]*",
            "birth_date": r"(19|20)[0-9]{2}年[0-9]{1,2}月[0-9]{1,2}日",
            "insurance_number": r"保険証番号[：:\s]*[0-9]{8,10}"
        }
    
    async def detect_pii_with_context(self, text: str, medical_context: bool = True) -> List[EnhancedPIIDetection]:
        """
        Azure OpenAI APIを使用した文脈理解PII検知
        
        Args:
            text: 検知対象テキスト
            medical_context: 医療文脈での検知かどうか
            
        Returns:
            List[EnhancedPIIDetection]: 検知されたPII情報のリスト
        """
        try:
            if not self.ai_service.azure_client:
                logger.warning("Azure OpenAI not available, using fallback detection")
                return await self._fallback_pii_detection(text)
            
            # Azure OpenAI APIを使った文脈理解PII検知
            prompt = self._create_pii_detection_prompt(text, medical_context)
            
            messages = [
                {"role": "system", "content": "あなたは医療文書のプライバシー保護専門家です。"},
                {"role": "user", "content": prompt}
            ]
            
            response = self.ai_service.azure_client.chat.completions.create(
                model=self.ai_service.deployment_name,
                messages=messages,
                max_tokens=1000,
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            
            # JSON解析とPII検知結果の変換
            pii_results = json.loads(content)
            detections = []
            
            for pii_item in pii_results.get("detected_pii", []):
                detection = EnhancedPIIDetection(
                    text=pii_item.get("text", ""),
                    start_pos=pii_item.get("start_pos", 0),
                    end_pos=pii_item.get("end_pos", 0),
                    pii_type=pii_item.get("type", "unknown"),
                    confidence=float(pii_item.get("confidence", 0.0)),
                    masked_text=pii_item.get("masked_text", "***"),
                    context=pii_item.get("context", ""),
                    reasoning=pii_item.get("reasoning", "")
                )
                detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"Enhanced PII detection error: {e}")
            # エラー時はフォールバック検知を使用
            return await self._fallback_pii_detection(text)
    
    def _create_pii_detection_prompt(self, text: str, medical_context: bool) -> str:
        """PII検知用のプロンプトを生成"""
        context_note = ""
        if medical_context:
            context_note = """
            医療文脈での注意点:
            - 疾患名や医学用語は個人情報ではありません
            - 薬剤名や検査値は通常は個人情報ではありません
            - ただし、稀な疾患や特殊な状況は個人特定につながる可能性があります
            """
        
        return f"""
以下の医療テキストから個人特定可能情報(PII)を検知してください。

{context_note}

【検知対象】:
- 患者名（フルネーム、姓のみ、名のみ）
- 患者番号・ID
- 電話番号
- メールアドレス  
- 住所（郵便番号含む）
- 生年月日
- 保険証番号
- その他の個人特定情報

【テキスト】:
{text}

【出力形式】:
{{
    "detected_pii": [
        {{
            "text": "検知された文字列",
            "start_pos": 開始位置,
            "end_pos": 終了位置,
            "type": "name|patient_id|phone|email|address|birth_date|insurance_number|other",
            "confidence": 0.0から1.0の信頼度,
            "masked_text": "適切にマスキングされた文字列",
            "context": "前後の文脈",
            "reasoning": "PII判定の理由"
        }}
    ],
    "analysis_summary": "全体的な分析結果"
}}
"""
    
    async def _fallback_pii_detection(self, text: str) -> List[EnhancedPIIDetection]:
        """フォールバック用の正規表現ベースPII検知"""
        detections = []
        
        for pii_type, pattern in self.fallback_patterns.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                start_pos = match.start()
                end_pos = match.end()
                matched_text = match.group()
                
                # 信頼度計算
                confidence = 0.8 if len(matched_text) > 5 else 0.6
                
                # マスキング処理
                masked_value = self._apply_masking(matched_text, pii_type)
                
                detection = EnhancedPIIDetection(
                    text=matched_text,
                    start_pos=start_pos,
                    end_pos=end_pos,
                    pii_type=pii_type,
                    confidence=confidence,
                    masked_text=masked_value,
                    context=text[max(0, start_pos-20):min(len(text), end_pos+20)],
                    reasoning="正規表現パターンマッチング（フォールバック）"
                )
                detections.append(detection)
        
        return detections
    
    def _apply_masking(self, text: str, pii_type: str) -> str:
        """PIIタイプに応じたマスキング処理"""
        if pii_type in ["patient_id", "phone", "email"]:
            # 末尾2文字残してマスク
            if len(text) > 2:
                return "*" * (len(text) - 2) + text[-2:]
            else:
                return "*" * len(text)
        elif pii_type == "name":
            # 最初の1文字残してマスク
            if len(text) > 1:
                return text[0] + "*" * (len(text) - 1)
            else:
                return "*"
        else:
            # 完全マスク
            return "*" * len(text)
    
    async def smart_masking(self, text: str, masking_level: str = "standard") -> Tuple[str, List[EnhancedPIIDetection]]:
        """
        目的に応じた適応的マスキング
        
        Args:
            text: 対象テキスト
            masking_level: minimal|standard|maximum
            
        Returns:
            Tuple[str, List[EnhancedPIIDetection]]: (マスキング済みテキスト, 検知結果)
        """
        try:
            # PII検知実行
            detections = await self.detect_pii_with_context(text, medical_context=True)
            
            # マスキングレベルに応じた処理
            masked_text = text
            
            for detection in sorted(detections, key=lambda x: x.start_pos, reverse=True):
                # 後ろから処理して位置がずれないようにする
                masked_value = self._get_masked_value_by_level(
                    detection.text, 
                    detection.pii_type, 
                    masking_level
                )
                
                masked_text = (
                    masked_text[:detection.start_pos] + 
                    masked_value + 
                    masked_text[detection.end_pos:]
                )
            
            return masked_text, detections
            
        except Exception as e:
            logger.error(f"Smart masking error: {e}")
            return text, []
    
    def _get_masked_value_by_level(self, text: str, pii_type: str, masking_level: str) -> str:
        """マスキングレベルに応じたマスク値を生成"""
        
        if masking_level == "minimal":
            # 最小限のマスキング
            if pii_type == "name":
                return text[0] + "***"  # 姓の一文字のみ残す
            elif pii_type in ["patient_id", "phone"]:
                return "***" + text[-2:]  # 末尾2文字残す
            else:
                return self._apply_masking(text, pii_type)
        
        elif masking_level == "standard":
            # 標準マスキング
            return self._apply_masking(text, pii_type)
        
        elif masking_level == "maximum":
            # 最大マスキング
            if pii_type == "name":
                return "[患者名]"
            elif pii_type == "patient_id":
                return "[患者ID]"
            elif pii_type == "phone":
                return "[電話番号]"
            elif pii_type == "address":
                return "[住所]"
            else:
                return "[個人情報]"
        
        return "*" * len(text)
    
    async def analyze_pii_risk(self, text: str) -> Dict[str, Any]:
        """PIIリスク分析"""
        detections = await self.detect_pii_with_context(text, medical_context=True)
        
        # リスク計算
        high_risk_types = ["name", "patient_id", "phone", "address"]
        medium_risk_types = ["birth_date", "insurance_number"]
        
        risk_score = 0.0
        high_risk_count = 0
        medium_risk_count = 0
        
        for detection in detections:
            if detection.pii_type in high_risk_types:
                risk_score += detection.confidence * 0.8
                high_risk_count += 1
            elif detection.pii_type in medium_risk_types:
                risk_score += detection.confidence * 0.4
                medium_risk_count += 1
        
        # 正規化
        risk_score = min(risk_score, 1.0)
        
        return {
            "overall_risk_score": risk_score,
            "risk_level": self._get_risk_level(risk_score),
            "detected_count": len(detections),
            "high_risk_pii": high_risk_count,
            "medium_risk_pii": medium_risk_count,
            "detections": [
                {
                    "type": d.pii_type,
                    "confidence": d.confidence,
                    "context": d.context[:50] + "..." if len(d.context) > 50 else d.context
                }
                for d in detections
            ],
            "recommendations": self._get_risk_recommendations(risk_score, detections)
        }
    
    def _get_risk_level(self, risk_score: float) -> str:
        """リスクスコアからリスクレベルを判定"""
        if risk_score >= 0.8:
            return "critical"
        elif risk_score >= 0.6:
            return "high"
        elif risk_score >= 0.3:
            return "medium"
        else:
            return "low"
    
    def _get_risk_recommendations(self, risk_score: float, detections: List[EnhancedPIIDetection]) -> List[str]:
        """リスクに基づく推奨事項を生成"""
        recommendations = []
        
        if risk_score >= 0.8:
            recommendations.append("最大レベルのマスキングを推奨します")
            recommendations.append("外部共有前に必ず内容を確認してください")
        elif risk_score >= 0.6:
            recommendations.append("標準レベルのマスキングを推奨します")
            recommendations.append("共有先を制限することを検討してください")
        elif risk_score >= 0.3:
            recommendations.append("最小限のマスキングで対応可能です")
        
        # 特定のPIIタイプに基づく推奨
        pii_types = [d.pii_type for d in detections]
        if "name" in pii_types:
            recommendations.append("患者名が含まれています - 匿名化を検討してください")
        if "patient_id" in pii_types:
            recommendations.append("患者IDが含まれています - 内部利用に限定してください")
        
        return recommendations