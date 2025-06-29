from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base

class MedicationForm(str, enum.Enum):
    """薬剤の剤形"""
    TABLET = "tablet"           # 錠剤
    CAPSULE = "capsule"         # カプセル
    LIQUID = "liquid"           # 液剤
    INJECTION = "injection"     # 注射剤
    OINTMENT = "ointment"       # 軟膏
    PATCH = "patch"             # 貼付剤
    SUPPOSITORY = "suppository" # 座薬
    OTHER = "other"             # その他

class MedicationCategory(str, enum.Enum):
    """薬剤の分類"""
    ANALGESIC = "analgesic"                 # 鎮痛薬
    ANTIBIOTIC = "antibiotic"               # 抗生物質
    ANTIHYPERTENSIVE = "antihypertensive"   # 降圧薬
    ANTIHISTAMINE = "antihistamine"         # 抗ヒスタミン薬
    ANTIPYRETIC = "antipyretic"             # 解熱薬
    ANTI_INFLAMMATORY = "anti_inflammatory"  # 抗炎症薬
    CARDIOVASCULAR = "cardiovascular"        # 循環器系薬
    GASTROINTESTINAL = "gastrointestinal"   # 消化器系薬
    RESPIRATORY = "respiratory"              # 呼吸器系薬
    ENDOCRINE = "endocrine"                 # 内分泌系薬
    NEUROLOGICAL = "neurological"           # 神経系薬
    PSYCHIATRIC = "psychiatric"             # 精神科薬
    DERMATOLOGICAL = "dermatological"       # 皮膚科薬
    OPHTHALMOLOGICAL = "ophthalmological"   # 眼科薬
    SUPPLEMENT = "supplement"               # サプリメント・ビタミン
    OTHER = "other"                         # その他

class Medication(Base):
    """薬剤マスターテーブル"""
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    
    # 薬剤基本情報
    drug_code = Column(String(20), unique=True, index=True, nullable=False, comment="薬剤コード（HOT番号等）")
    drug_name = Column(String(200), nullable=False, index=True, comment="薬剤名")
    generic_name = Column(String(200), nullable=True, comment="一般名")
    brand_name = Column(String(200), nullable=True, comment="商品名")
    manufacturer = Column(String(100), nullable=True, comment="製造会社")
    
    # 剤形・分類
    form = Column(Enum(MedicationForm), nullable=False, comment="剤形")
    category = Column(Enum(MedicationCategory), nullable=True, comment="薬効分類")
    atc_code = Column(String(20), nullable=True, comment="ATC分類コード")
    
    # 薬剤詳細情報
    strength = Column(String(50), nullable=True, comment="含有量（例：500mg）")
    unit = Column(String(20), nullable=True, comment="単位（錠、ml等）")
    description = Column(Text, nullable=True, comment="薬剤説明")
    indications = Column(Text, nullable=True, comment="適応症")
    contraindications = Column(Text, nullable=True, comment="禁忌")
    side_effects = Column(Text, nullable=True, comment="副作用")
    interactions = Column(Text, nullable=True, comment="相互作用")
    
    # 用法・用量情報
    standard_dosage = Column(String(100), nullable=True, comment="標準用法用量")
    max_daily_dose = Column(Float, nullable=True, comment="1日最大用量")
    min_daily_dose = Column(Float, nullable=True, comment="1日最小用量")
    
    # 保険・価格情報
    insurance_code = Column(String(20), nullable=True, comment="保険コード")
    unit_price = Column(Float, nullable=True, comment="薬価（単価）")
    
    # フラグ
    is_prescription_required = Column(Boolean, default=True, comment="処方箋必要薬")
    is_controlled_substance = Column(Boolean, default=False, comment="麻薬・向精神薬")
    is_active = Column(Boolean, default=True, comment="有効フラグ")
    
    # 作成・更新日時
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # リレーション
    prescription_items = relationship("PrescriptionItem", back_populates="medication", foreign_keys="PrescriptionItem.medication_id")
    
    def __repr__(self):
        return f"<Medication(drug_code='{self.drug_code}', drug_name='{self.drug_name}')>"

    @property
    def display_name(self):
        """表示用薬剤名（商品名 or 薬剤名）"""
        return self.brand_name or self.drug_name
    
    @property
    def full_name(self):
        """完全な薬剤名（薬剤名 + 含有量）"""
        if self.strength:
            return f"{self.display_name} {self.strength}"
        return self.display_name