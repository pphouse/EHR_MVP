#!/usr/bin/env python3
"""
サンプル薬剤データを作成するスクリプト
"""
import os
import sys
from datetime import datetime

# プロジェクトのルートディレクトリをPythonパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import sessionmaker
from app.core.database import engine
from app.models.medication import Medication, MedicationForm, MedicationCategory

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_sample_medications():
    """一般的な薬剤のサンプルデータを作成"""
    
    sample_medications = [
        # 解熱鎮痛薬
        {
            "drug_code": "HOT001",
            "drug_name": "アセトアミノフェン錠",
            "generic_name": "アセトアミノフェン",
            "brand_name": "カロナール錠500",
            "manufacturer": "あゆみ製薬",
            "form": MedicationForm.TABLET,
            "category": MedicationCategory.ANALGESIC,
            "strength": "500mg",
            "unit": "錠",
            "description": "解熱鎮痛薬。発熱、頭痛、歯痛などに使用",
            "indications": "発熱、頭痛、歯痛、生理痛、関節痛、筋肉痛",
            "contraindications": "重篤な肝障害、重篤な腎障害",
            "side_effects": "まれに発疹、悪心、嘔吐",
            "standard_dosage": "1回1-2錠、1日3-4回",
            "max_daily_dose": 4000.0,
            "min_daily_dose": 500.0,
            "unit_price": 5.90,
            "is_prescription_required": False
        },
        # 抗生物質
        {
            "drug_code": "HOT002", 
            "drug_name": "アモキシシリンカプセル",
            "generic_name": "アモキシシリン",
            "brand_name": "サワシリンカプセル250",
            "manufacturer": "沢井製薬",
            "form": MedicationForm.CAPSULE,
            "category": MedicationCategory.ANTIBIOTIC,
            "strength": "250mg",
            "unit": "カプセル",
            "description": "ペニシリン系抗生物質",
            "indications": "感染症（呼吸器、尿路、皮膚軟部組織など）",
            "contraindications": "ペニシリン系薬剤に対する過敏症",
            "side_effects": "下痢、発疹、悪心、嘔吐",
            "standard_dosage": "1回1-2カプセル、1日3-4回",
            "max_daily_dose": 3000.0,
            "min_daily_dose": 750.0,
            "unit_price": 18.20,
            "is_prescription_required": True
        },
        # 降圧薬
        {
            "drug_code": "HOT003",
            "drug_name": "アムロジピン錠",
            "generic_name": "アムロジピンベシル酸塩",
            "brand_name": "アムロジン錠5mg",
            "manufacturer": "大日本住友製薬",
            "form": MedicationForm.TABLET,
            "category": MedicationCategory.ANTIHYPERTENSIVE,
            "strength": "5mg", 
            "unit": "錠",
            "description": "カルシウム拮抗薬（高血圧治療薬）",
            "indications": "高血圧症、狭心症",
            "contraindications": "妊婦、授乳婦",
            "side_effects": "浮腫、ほてり、頭痛、めまい",
            "standard_dosage": "1回1錠、1日1回",
            "max_daily_dose": 10.0,
            "min_daily_dose": 2.5,
            "unit_price": 25.30,
            "is_prescription_required": True
        },
        # 胃薬
        {
            "drug_code": "HOT004",
            "drug_name": "オメプラゾールカプセル",
            "generic_name": "オメプラゾール",
            "brand_name": "オメプラール錠20",
            "manufacturer": "アストラゼネカ",
            "form": MedicationForm.CAPSULE,
            "category": MedicationCategory.GASTROINTESTINAL,
            "strength": "20mg",
            "unit": "カプセル",
            "description": "プロトンポンプ阻害薬（胃酸分泌抑制薬）",
            "indications": "胃潰瘍、十二指腸潰瘍、逆流性食道炎",
            "contraindications": "本剤に対する過敏症",
            "side_effects": "下痢、頭痛、発疹",
            "standard_dosage": "1回1カプセル、1日1回朝食前",
            "max_daily_dose": 40.0,
            "min_daily_dose": 10.0,
            "unit_price": 89.50,
            "is_prescription_required": True
        },
        # 抗ヒスタミン薬
        {
            "drug_code": "HOT005",
            "drug_name": "ロラタジン錠",
            "generic_name": "ロラタジン",
            "brand_name": "クラリチン錠10mg",
            "manufacturer": "シェリング・プラウ",
            "form": MedicationForm.TABLET,
            "category": MedicationCategory.ANTIHISTAMINE,
            "strength": "10mg",
            "unit": "錠",
            "description": "第2世代抗ヒスタミン薬（アレルギー治療薬）",
            "indications": "アレルギー性鼻炎、蕁麻疹、皮膚炎",
            "contraindications": "本剤に対する過敏症",
            "side_effects": "眠気、口渇、頭痛",
            "standard_dosage": "1回1錠、1日1回",
            "max_daily_dose": 10.0,
            "min_daily_dose": 10.0,
            "unit_price": 54.40,
            "is_prescription_required": True
        },
        # 外用薬
        {
            "drug_code": "HOT006",
            "drug_name": "ヒルドイドローション",
            "generic_name": "ヘパリン類似物質",
            "brand_name": "ヒルドイドローション0.3%",
            "manufacturer": "マルホ",
            "form": MedicationForm.LIQUID,
            "category": MedicationCategory.DERMATOLOGICAL,
            "strength": "0.3%",
            "unit": "g",
            "description": "血行促進・保湿薬",
            "indications": "血行障害による疼痛・腫脹、外傷後の腫脹・血腫、乾燥性皮膚炎",
            "contraindications": "出血性血液疾患",
            "side_effects": "発疹、かゆみ、発赤",
            "standard_dosage": "1日1-数回適量を患部に塗布",
            "unit_price": 25.20,
            "is_prescription_required": True
        },
        # ビタミン剤
        {
            "drug_code": "HOT007",
            "drug_name": "総合ビタミン錠",
            "generic_name": "総合ビタミン",
            "brand_name": "ネイチャーメイド マルチビタミン",
            "manufacturer": "大塚製薬",
            "form": MedicationForm.TABLET,
            "category": MedicationCategory.SUPPLEMENT,
            "strength": "-",
            "unit": "錠",
            "description": "総合ビタミン・ミネラル補給剤",
            "indications": "ビタミン・ミネラル補給",
            "contraindications": "特になし",
            "side_effects": "まれに胃部不快感",
            "standard_dosage": "1回1錠、1日1回食後",
            "unit_price": 8.50,
            "is_prescription_required": False
        },
        # 目薬
        {
            "drug_code": "HOT008",
            "drug_name": "人工涙液",
            "generic_name": "人工涙液",
            "brand_name": "ソフトサンティア",
            "manufacturer": "参天製薬",
            "form": MedicationForm.LIQUID,
            "category": MedicationCategory.OPHTHALMOLOGICAL,
            "strength": "-",
            "unit": "本",
            "description": "人工涙液（目の乾燥改善）",
            "indications": "ドライアイ、角膜保護",
            "contraindications": "特になし",
            "side_effects": "まれに刺激感",
            "standard_dosage": "1回1-2滴、1日5-6回点眼",
            "unit_price": 12.30,
            "is_prescription_required": False
        }
    ]
    
    db = SessionLocal()
    try:
        for med_data in sample_medications:
            # 既に存在するかチェック
            existing_med = db.query(Medication).filter(
                Medication.drug_code == med_data["drug_code"]
            ).first()
            
            if not existing_med:
                medication = Medication(**med_data)
                db.add(medication)
                print(f"✓ 薬剤追加: {med_data['drug_name']}")
            else:
                print(f"- 既存薬剤をスキップ: {med_data['drug_name']}")
        
        db.commit()
        print(f"\n✅ サンプル薬剤データの作成が完了しました")
        
        # 作成された薬剤数を確認
        total_count = db.query(Medication).count()
        print(f"📊 現在の薬剤データ総数: {total_count}件")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_medications()