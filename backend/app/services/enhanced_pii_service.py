"""
Enhanced PII Detection Service
高度な個人情報検知・マスキング (Simple Implementation)
"""
import json
import re
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import logging

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
    """簡易版PII検知サービス"""
    
    def __init__(self):
        # 基本的な正規表現パターン
        self.patterns = {
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
        簡易PII検知
        """
        detections = []
        
        for pii_type, pattern in self.patterns.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                detection = EnhancedPIIDetection(
                    text=match.group(),
                    start_pos=match.start(),
                    end_pos=match.end(),
                    pii_type=pii_type,
                    confidence=0.8,
                    masked_text=self._apply_masking(match.group(), pii_type),
                    context="regex_match",
                    reasoning=f"Pattern matched for {pii_type}"
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
    
    def _get_masked_value_by_level(self, text: str, pii_type: str, level: str) -> str:
        """マスキングレベルに応じたマスク値取得"""
        if level == "minimal":
            # 最小マスキング（医療情報として必要な部分は保持）
            if pii_type == "name":
                return text  # 名前は保持
            elif pii_type in ["birth_date"]:
                return text  # 生年月日は保持
            else:
                return self._apply_masking(text, pii_type)
        elif level == "maximum":
            # 最大マスキング
            return "*" * len(text)
        else:
            # 標準マスキング
            return self._apply_masking(text, pii_type)
    
    async def analyze_pii_risk(self, text: str) -> Dict[str, Any]:
        """PII漏えいリスク分析"""
        detections = await self.detect_pii_with_context(text)
        
        risk_score = min(len(detections) * 0.2, 1.0)
        risk_level = "low"
        
        if risk_score >= 0.7:
            risk_level = "high"
        elif risk_score >= 0.4:
            risk_level = "medium"
        
        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "detected_pii_count": len(detections),
            "pii_types": list(set([d.pii_type for d in detections])),
            "recommendation": "高リスク" if risk_level == "high" else "要注意" if risk_level == "medium" else "低リスク"
        }