"""
AI Assistant Service - Azure OpenAI APIセーフティレイヤー
ハルシネーション検知、PII漏えい検知、自動リライト機能を提供
"""

import os
import json
import re
import hashlib
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging
from dataclasses import dataclass
from enum import Enum
import asyncio
from sqlalchemy.orm import Session
from openai import AzureOpenAI

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    """リスクレベル定義"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SafetyAction(Enum):
    """セーフティアクション定義"""
    ALLOW = "allow"
    MASK = "mask"
    REWRITE = "rewrite"
    BLOCK = "block"


@dataclass
class SafetyResult:
    """セーフティチェック結果"""
    original_text: str
    processed_text: str
    risk_level: RiskLevel
    action_taken: SafetyAction
    confidence_score: float
    detected_issues: List[Dict[str, Any]]
    processing_time_ms: int
    audit_hash: str


@dataclass
class PIIDetection:
    """PII検知結果"""
    text: str
    start_pos: int
    end_pos: int
    pii_type: str
    confidence: float
    masked_text: str


class AIAssistantService:
    """AI Assistant Service with Azure OpenAI API Safety Layer"""
    
    def __init__(self):
        # Import settings from config
        from app.core.config import settings
        
        # Azure OpenAI API設定
        self.azure_openai_endpoint = settings.azure_openai_endpoint
        self.azure_openai_key = settings.azure_openai_key
        self.azure_openai_version = settings.azure_openai_version
        self.deployment_name = settings.azure_openai_deployment_name or "gpt-4.1-mini"
        
        # Azure OpenAIクライアントの初期化
        self.azure_client = None
        if self.azure_openai_key and self.azure_openai_endpoint:
            try:
                self.azure_client = AzureOpenAI(
                    api_key=self.azure_openai_key,
                    azure_endpoint=self.azure_openai_endpoint,
                    api_version=self.azure_openai_version
                )
                logger.info("Azure OpenAI client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Azure OpenAI client: {e}")
        
        # セーフティ設定
        self.hallucination_threshold = settings.hallucination_threshold
        self.pii_threshold = settings.pii_threshold
        self.enable_auto_rewrite = settings.enable_auto_rewrite
        
        # PII検知パターン
        self.pii_patterns = {
            "patient_id": r"患者番号[：:\s]*([0-9A-Za-z\-]{6,20})",
            "phone": r"(0[0-9]{1,4}-[0-9]{1,4}-[0-9]{3,4}|0[0-9]{9,11})",
            "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
            "address": r"〒?[0-9]{3}-?[0-9]{4}.+?(市|区|町|村)",
            "name": r"(田中|佐藤|高橋|山田|渡辺|伊藤|中村|小林|山本|加藤)[　\s]*[一二三四五六七八九十太郎次郎花子美子愛子][一二三四五六七八九十郎子美愛]*",
            "birth_date": r"(19|20)[0-9]{2}年[0-9]{1,2}月[0-9]{1,2}日",
            "insurance_number": r"保険証番号[：:\s]*[0-9]{8,10}"
        }
        
        # 医療専門用語辞書（ハルシネーション検知用）
        self.medical_terms = {
            "症状": ["発熱", "頭痛", "腹痛", "咳嗽", "呼吸困難", "胸痛", "めまい", "嘔吐", "下痢"],
            "診断": ["高血圧", "糖尿病", "脂質異常症", "心房細動", "心筋梗塞", "脳梗塞", "肺炎", "胃炎"],
            "薬剤": ["アムロジピン", "メトホルミン", "アトルバスタチン", "ワルファリン", "アスピリン"],
            "検査": ["血液検査", "心電図", "胸部X線", "CT", "MRI", "エコー検査", "内視鏡"]
        }
    
    async def process_medical_text(self, text: str, context: Dict[str, Any] = None) -> SafetyResult:
        """
        医療テキストの安全性チェックとセーフティレイヤー処理
        """
        start_time = datetime.now()
        
        try:
            # 1. PII検知とマスキング
            pii_detections, masked_text = await self._detect_and_mask_pii(text)
            
            # 2. ハルシネーション検知
            hallucination_score = await self._detect_hallucination(masked_text, context)
            
            # 3. リスクレベル判定
            risk_level = self._calculate_risk_level(pii_detections, hallucination_score)
            
            # 4. セーフティアクション決定
            action = self._determine_safety_action(risk_level, pii_detections)
            
            # 5. 自動リライト（必要に応じて）
            final_text = masked_text
            if action == SafetyAction.REWRITE and self.enable_auto_rewrite:
                final_text = await self._auto_rewrite_text(masked_text, context)
            elif action == SafetyAction.BLOCK:
                final_text = "[医療安全上の理由により、この内容は表示できません]"
            
            # 6. 信頼度スコア計算
            confidence_score = self._calculate_confidence_score(pii_detections, hallucination_score)
            
            # 7. 検知問題のサマリー
            detected_issues = self._summarize_detected_issues(pii_detections, hallucination_score)
            
            # 8. 監査ハッシュ生成
            audit_hash = self._generate_audit_hash(text, final_text, detected_issues)
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            result = SafetyResult(
                original_text=text,
                processed_text=final_text,
                risk_level=risk_level,
                action_taken=action,
                confidence_score=confidence_score,
                detected_issues=detected_issues,
                processing_time_ms=processing_time,
                audit_hash=audit_hash
            )
            
            # 監査ログ保存
            await self._save_audit_log(result, context)
            
            return result
            
        except Exception as e:
            logger.error(f"AI Assistant Service error: {e}")
            # エラー時は保守的にブロック
            return SafetyResult(
                original_text=text,
                processed_text="[システムエラーにより処理できません]",
                risk_level=RiskLevel.CRITICAL,
                action_taken=SafetyAction.BLOCK,
                confidence_score=0.0,
                detected_issues=[{"type": "system_error", "message": str(e)}],
                processing_time_ms=int((datetime.now() - start_time).total_seconds() * 1000),
                audit_hash=""
            )
    
    async def _detect_and_mask_pii(self, text: str) -> Tuple[List[PIIDetection], str]:
        """PII検知とマスキング処理"""
        detections = []
        masked_text = text
        
        for pii_type, pattern in self.pii_patterns.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                start_pos = match.start()
                end_pos = match.end()
                matched_text = match.group()
                
                # 信頼度計算（簡易版）
                confidence = 0.9 if len(matched_text) > 5 else 0.7
                
                # マスキング処理
                if pii_type in ["patient_id", "phone", "email"]:
                    masked_value = "*" * (len(matched_text) - 2) + matched_text[-2:]
                elif pii_type == "name":
                    masked_value = matched_text[0] + "*" * (len(matched_text) - 1)
                else:
                    masked_value = "*" * len(matched_text)
                
                detection = PIIDetection(
                    text=matched_text,
                    start_pos=start_pos,
                    end_pos=end_pos,
                    pii_type=pii_type,
                    confidence=confidence,
                    masked_text=masked_value
                )
                detections.append(detection)
                
                # テキスト内のマスキング適用
                masked_text = masked_text.replace(matched_text, masked_value, 1)
        
        return detections, masked_text
    
    async def _detect_hallucination(self, text: str, context: Dict[str, Any] = None) -> float:
        """ハルシネーション検知（Azure OpenAI API使用）"""
        if not self.azure_client:
            logger.warning("Azure OpenAI client not initialized, skipping hallucination detection")
            return 0.0
        
        try:
            # Azure OpenAI APIでファクトチェック
            prompt = f"""
以下の医療テキストに含まれる医学的事実の正確性を評価してください。
不正確または疑わしい情報があれば指摘し、0.0から1.0のリスクスコアを付けてください。

テキスト: {text}

評価基準:
- 0.0-0.3: 医学的に正確
- 0.4-0.6: 一部疑問点あり
- 0.7-0.9: 不正確な可能性が高い
- 1.0: 明らかに誤った情報

JSON形式で回答してください:
{{"risk_score": 0.0, "issues": ["問題点1", "問題点2"], "reasoning": "判定理由"}}
"""
            
            messages = [
                {"role": "system", "content": "あなたは医療AI安全性評価の専門家です。"},
                {"role": "user", "content": prompt}
            ]
            
            response = self.azure_client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                max_tokens=500,
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            
            # JSON解析
            try:
                parsed = json.loads(content)
                return float(parsed.get("risk_score", 0.0))
            except json.JSONDecodeError:
                logger.warning("Failed to parse hallucination detection response")
                return 0.0
                    
        except Exception as e:
            logger.error(f"Hallucination detection error: {e}")
            return 0.0
    
    def _calculate_risk_level(self, pii_detections: List[PIIDetection], hallucination_score: float) -> RiskLevel:
        """総合リスクレベル計算"""
        # PII検知による基本リスク
        pii_risk = 0.0
        for detection in pii_detections:
            if detection.pii_type in ["patient_id", "insurance_number"]:
                pii_risk = max(pii_risk, 0.8)
            elif detection.pii_type in ["name", "phone", "address"]:
                pii_risk = max(pii_risk, 0.6)
            else:
                pii_risk = max(pii_risk, 0.4)
        
        # ハルシネーションリスクとの組み合わせ
        combined_risk = max(pii_risk, hallucination_score)
        
        if combined_risk >= 0.8:
            return RiskLevel.CRITICAL
        elif combined_risk >= 0.6:
            return RiskLevel.HIGH
        elif combined_risk >= 0.3:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def _determine_safety_action(self, risk_level: RiskLevel, pii_detections: List[PIIDetection]) -> SafetyAction:
        """セーフティアクション決定"""
        if risk_level == RiskLevel.CRITICAL:
            return SafetyAction.BLOCK
        elif risk_level == RiskLevel.HIGH:
            return SafetyAction.REWRITE
        elif len(pii_detections) > 0:
            return SafetyAction.MASK
        else:
            return SafetyAction.ALLOW
    
    async def _auto_rewrite_text(self, text: str, context: Dict[str, Any] = None) -> str:
        """自動リライト処理"""
        if not self.azure_client:
            return text
        
        try:
            prompt = f"""
以下の医療テキストを、医学的正確性を保ちながら、より安全で適切な表現に書き直してください。

元のテキスト: {text}

要件:
- 医学的事実は正確に保つ
- 不確実な表現は適切に修正
- 患者の安全を最優先に考慮
- 自然で読みやすい日本語

書き直し後のテキストのみを回答してください。
"""
            
            messages = [
                {"role": "system", "content": "あなたは医療文書の安全性改善を専門とするAIです。"},
                {"role": "user", "content": prompt}
            ]
            
            response = self.azure_client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                max_tokens=800,
                temperature=0.2
            )
            
            return response.choices[0].message.content.strip()
                    
        except Exception as e:
            logger.error(f"Auto rewrite error: {e}")
            return text
    
    def _calculate_confidence_score(self, pii_detections: List[PIIDetection], hallucination_score: float) -> float:
        """信頼度スコア計算"""
        pii_confidence = sum(d.confidence for d in pii_detections) / max(len(pii_detections), 1)
        hallucination_confidence = 1.0 - hallucination_score
        
        # 重み付け平均
        return (pii_confidence * 0.4 + hallucination_confidence * 0.6)
    
    def _summarize_detected_issues(self, pii_detections: List[PIIDetection], hallucination_score: float) -> List[Dict[str, Any]]:
        """検知問題のサマリー"""
        issues = []
        
        # PII問題
        for detection in pii_detections:
            issues.append({
                "type": "pii_detected",
                "category": detection.pii_type,
                "confidence": detection.confidence,
                "description": f"{detection.pii_type}が検出されました"
            })
        
        # ハルシネーション問題
        if hallucination_score >= self.hallucination_threshold:
            issues.append({
                "type": "hallucination_risk",
                "score": hallucination_score,
                "description": "医学的事実に疑問があります"
            })
        
        return issues
    
    def _generate_audit_hash(self, original: str, processed: str, issues: List[Dict]) -> str:
        """監査用ハッシュ生成"""
        audit_data = {
            "original_hash": hashlib.sha256(original.encode()).hexdigest()[:16],
            "processed_hash": hashlib.sha256(processed.encode()).hexdigest()[:16],
            "issues_count": len(issues),
            "timestamp": datetime.now().isoformat()
        }
        
        audit_string = json.dumps(audit_data, sort_keys=True)
        return hashlib.sha256(audit_string.encode()).hexdigest()[:32]
    
    async def _save_audit_log(self, result: SafetyResult, context: Dict[str, Any] = None):
        """監査ログ保存"""
        try:
            audit_entry = {
                "timestamp": datetime.now().isoformat(),
                "risk_level": result.risk_level.value,
                "action_taken": result.action_taken.value,
                "confidence_score": result.confidence_score,
                "processing_time_ms": result.processing_time_ms,
                "detected_issues": result.detected_issues,
                "audit_hash": result.audit_hash,
                "context": context or {}
            }
            
            # TODO: 実際の監査ログDB保存処理を実装
            logger.info(f"Audit log: {json.dumps(audit_entry, ensure_ascii=False)}")
            
        except Exception as e:
            logger.error(f"Failed to save audit log: {e}")
    
    async def get_safety_status(self) -> Dict[str, Any]:
        """セーフティレイヤーの状態取得"""
        return {
            "azure_openai_configured": bool(self.azure_client),
            "hallucination_threshold": self.hallucination_threshold,
            "pii_threshold": self.pii_threshold,
            "auto_rewrite_enabled": self.enable_auto_rewrite,
            "supported_pii_types": list(self.pii_patterns.keys()),
            "medical_terms_loaded": len(self.medical_terms),
            "deployment_name": self.deployment_name,
            "api_version": self.azure_openai_version
        }