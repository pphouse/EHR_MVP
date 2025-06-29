from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base

class PrescriptionStatus(str, enum.Enum):
    """処方箋ステータス"""
    DRAFT = "draft"           # 下書き
    PRESCRIBED = "prescribed" # 処方済み
    DISPENSED = "dispensed"   # 調剤済み
    PARTIALLY_DISPENSED = "partially_dispensed" # 一部調剤済み
    CANCELLED = "cancelled"   # 中止
    EXPIRED = "expired"       # 期限切れ

class Prescription(Base):
    """処方箋テーブル"""
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    
    # 処方箋識別情報
    prescription_number = Column(String(50), unique=True, index=True, nullable=True, comment="処方箋番号")
    
    # 関連エンティティ
    encounter_id = Column(Integer, ForeignKey("encounters.id"), nullable=False, comment="診療記録ID")
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, comment="患者ID")
    prescriber_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="処方医ID")
    
    # 処方箋情報
    prescription_date = Column(DateTime(timezone=True), nullable=False, comment="処方日")
    dispensing_date = Column(DateTime(timezone=True), nullable=True, comment="調剤日")
    expiry_date = Column(DateTime(timezone=True), nullable=True, comment="有効期限")
    
    # ステータスと分類
    status = Column(Enum(PrescriptionStatus), default=PrescriptionStatus.DRAFT, comment="処方箋ステータス")
    prescription_type = Column(String(50), default="general", comment="処方タイプ（一般、頓服、外用等）")
    
    # 処方に関するメモ
    notes = Column(Text, nullable=True, comment="処方に関する注意事項・メモ")
    dispensing_instructions = Column(Text, nullable=True, comment="調剤指示")
    
    # 薬局情報
    pharmacy_name = Column(String(200), nullable=True, comment="調剤薬局名")
    pharmacist_name = Column(String(100), nullable=True, comment="調剤薬剤師名")
    
    # 費用情報
    total_cost = Column(Float, nullable=True, comment="総費用")
    insurance_coverage = Column(Float, nullable=True, comment="保険適用額")
    patient_payment = Column(Float, nullable=True, comment="患者負担額")
    
    # フラグ
    is_repeat_prescription = Column(Boolean, default=False, comment="リピート処方")
    is_emergency = Column(Boolean, default=False, comment="緊急処方")
    requires_special_handling = Column(Boolean, default=False, comment="特別管理必要")
    
    # 作成・更新日時
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # リレーション
    encounter = relationship("Encounter", back_populates="prescriptions")
    patient = relationship("Patient", back_populates="prescriptions")
    prescriber = relationship("User", back_populates="prescriptions")
    prescription_items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Prescription(id={self.id}, prescription_number='{self.prescription_number}')>"
    
    @property
    def total_medications(self):
        """処方薬剤の総数"""
        return len(self.prescription_items)
    
    @property
    def is_dispensed(self):
        """調剤済みかどうか"""
        return self.status in [PrescriptionStatus.DISPENSED, PrescriptionStatus.PARTIALLY_DISPENSED]
    
    @property
    def days_until_expiry(self):
        """有効期限までの日数"""
        if self.expiry_date:
            from datetime import datetime
            return (self.expiry_date - datetime.now()).days
        return None

class PrescriptionItem(Base):
    """処方薬剤明細テーブル"""
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    
    # 関連エンティティ
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False, comment="処方箋ID")
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False, comment="薬剤ID")
    
    # 処方詳細
    dosage = Column(String(100), nullable=True, comment="用法用量（例：1回2錠、1日3回食後）")
    quantity = Column(Float, nullable=False, comment="処方量")
    unit = Column(String(20), nullable=True, default="tablet", comment="単位（錠、包、ml等）")
    duration_days = Column(Integer, nullable=True, comment="投薬日数")
    
    # 服薬指示
    administration_route = Column(String(50), default="oral", comment="投与経路（経口、外用、注射等）")
    frequency = Column(String(100), nullable=True, comment="服薬頻度（1日3回等）")
    timing = Column(String(100), nullable=True, comment="服薬タイミング（食前、食後等）")
    instructions = Column(Text, nullable=True, comment="特別な服薬指示")
    
    # 代替・変更情報
    is_generic_substitution_allowed = Column(Boolean, default=True, comment="ジェネリック代替可")
    original_medication_id = Column(Integer, ForeignKey("medications.id"), nullable=True, comment="元の薬剤ID（変更の場合）")
    substitution_reason = Column(String(200), nullable=True, comment="代替理由")
    
    # 費用情報
    unit_cost = Column(Float, nullable=True, comment="単価")
    total_cost = Column(Float, nullable=True, comment="小計")
    
    # 調剤情報
    dispensed_quantity = Column(Float, default=0, comment="調剤済み量")
    dispensed_date = Column(DateTime(timezone=True), nullable=True, comment="調剤日")
    is_dispensed = Column(Boolean, default=False, comment="調剤済みフラグ")
    
    # 作成・更新日時
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # リレーション
    prescription = relationship("Prescription", back_populates="prescription_items")
    medication = relationship("Medication", back_populates="prescription_items", foreign_keys=[medication_id])
    original_medication = relationship("Medication", foreign_keys=[original_medication_id])
    
    def __repr__(self):
        return f"<PrescriptionItem(id={self.id}, medication_id={self.medication_id}, quantity={self.quantity})>"
    
    @property
    def remaining_quantity(self):
        """残りの調剤量"""
        return self.quantity - self.dispensed_quantity
    
    @property
    def dispensing_progress(self):
        """調剤進捗率（%）"""
        if self.quantity > 0:
            return (self.dispensed_quantity / self.quantity) * 100
        return 0