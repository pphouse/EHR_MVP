#!/usr/bin/env python3
"""
完全なデモデータ作成スクリプト
- デモユーザー
- サンプル患者
- サンプル診療記録（エンカウンター）
- サンプル薬剤
毎回データを作り直す必要がないよう、永続化されたダミーデータを作成
"""

import os
import sys
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# プロジェクトルートをPythonパスに追加
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db, Base
from app.models.user import User
from app.models.patient import Patient  
from app.models.encounter import Encounter
from app.models.medication import Medication
from app.core.security import get_password_hash

# データベース設定
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ehr_mvp.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_demo_data():
    """完全なデモデータを作成"""
    
    # テーブル作成
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("🏥 完全なデモデータ作成開始...")
        
        # 1. デモユーザー作成
        print("👤 デモユーザー作成...")
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            demo_user = User(
                username="demo",
                email="demo@example.com",
                full_name="Demo Doctor",
                hashed_password=get_password_hash("demo123"),
                is_active=True,
                role="doctor"
            )
            db.add(demo_user)
            db.commit()
            print("✅ デモユーザー作成完了")
        else:
            print("ℹ️ デモユーザー既存")
        
        # 2. サンプル患者作成
        print("👥 サンプル患者作成...")
        from app.models.patient import Gender
        
        patients_data = [
            {
                "patient_id": "P001", 
                "first_name": "太郎",
                "last_name": "田中",
                "first_name_kana": "タロウ",
                "last_name_kana": "タナカ",
                "email": "tanaka@example.com",
                "phone": "090-1234-5678",
                "date_of_birth": datetime(1980, 5, 15).date(),
                "gender": Gender.MALE,
                "emergency_contact_name": "田中花子",
                "emergency_contact_phone": "090-8765-4321",
                "emergency_contact_relationship": "妻"
            },
            {
                "patient_id": "P002", 
                "first_name": "花子",
                "last_name": "佐藤",
                "first_name_kana": "ハナコ",
                "last_name_kana": "サトウ",
                "email": "sato@example.com",
                "phone": "090-2345-6789", 
                "date_of_birth": datetime(1992, 8, 22).date(),
                "gender": Gender.FEMALE,
                "emergency_contact_name": "佐藤一郎",
                "emergency_contact_phone": "090-9876-5432",
                "emergency_contact_relationship": "夫"
            },
            {
                "patient_id": "P003", 
                "first_name": "一郎",
                "last_name": "鈴木",
                "first_name_kana": "イチロウ",
                "last_name_kana": "スズキ",
                "email": "suzuki@example.com",
                "phone": "090-3456-7890",
                "date_of_birth": datetime(1975, 12, 3).date(), 
                "gender": Gender.MALE,
                "emergency_contact_name": "鈴木美子",
                "emergency_contact_phone": "090-6543-2109",
                "emergency_contact_relationship": "妻"
            }
        ]
        
        for patient_data in patients_data:
            existing_patient = db.query(Patient).filter(Patient.patient_id == patient_data["patient_id"]).first()
            if not existing_patient:
                patient = Patient(**patient_data)
                db.add(patient)
                print(f"✅ 患者追加: {patient_data['last_name']} {patient_data['first_name']}")
            else:
                print(f"ℹ️ 患者既存: {patient_data['last_name']} {patient_data['first_name']}")
        
        db.commit()
        
        # 3. サンプル診療記録作成
        print("📋 サンプル診療記録作成...")
        from app.models.encounter import EncounterStatus, EncounterClass
        
        patients = db.query(Patient).all()
        
        for i, patient in enumerate(patients):
            encounter_data = [
                {
                    "encounter_id": f"E{str(i+1).zfill(3)}-001",
                    "patient_id": patient.id,
                    "practitioner_id": demo_user.id,
                    "start_time": datetime.now() - timedelta(days=i*7),
                    "end_time": datetime.now() - timedelta(days=i*7, hours=-1),
                    "status": EncounterStatus.FINISHED,
                    "encounter_class": EncounterClass.AMBULATORY,
                    "subjective": f"{patient.full_name}の定期健診。特に症状なし。",
                    "objective": "バイタルサイン安定。身体所見特記事項なし。",
                    "assessment": "健康状態良好",
                    "plan": "経過観察継続"
                }
            ]
            
            for enc_data in encounter_data:
                existing_encounter = db.query(Encounter).filter(Encounter.encounter_id == enc_data["encounter_id"]).first()
                if not existing_encounter:
                    encounter = Encounter(**enc_data)
                    db.add(encounter)
                    print(f"✅ 診療記録追加: {enc_data['encounter_id']}")
                else:
                    print(f"ℹ️ 診療記録既存: {enc_data['encounter_id']}")
        
        db.commit()
        
        # 4. サンプル薬剤作成
        print("💊 サンプル薬剤作成...")
        medications_data = [
            {
                "drug_code": "MED001",
                "drug_name": "アセトアミノフェン錠",
                "generic_name": "アセトアミノフェン", 
                "brand_name": "カロナール錠500",
                "manufacturer": "あゆみ製薬",
                "form": "tablet",
                "strength": "500mg",
                "category": "analgesic",
                "is_active": True
            },
            {
                "drug_code": "MED002",
                "drug_name": "アモキシシリンカプセル",
                "generic_name": "アモキシシリン",
                "brand_name": "サワシリンカプセル250",
                "manufacturer": "LTLファーマ",
                "form": "capsule", 
                "strength": "250mg",
                "category": "antibiotic",
                "is_active": True
            },
            {
                "drug_code": "MED003", 
                "drug_name": "アムロジピン錠",
                "generic_name": "アムロジピン",
                "brand_name": "ノルバスク錠5mg",
                "manufacturer": "ファイザー",
                "form": "tablet",
                "strength": "5mg", 
                "category": "antihypertensive",
                "is_active": True
            },
            {
                "drug_code": "MED004",
                "drug_name": "オメプラゾールカプセル",
                "generic_name": "オメプラゾール",
                "brand_name": "オメプラール錠20",
                "manufacturer": "アストラゼネカ",
                "form": "capsule",
                "strength": "20mg",
                "category": "ppi",
                "is_active": True
            }
        ]
        
        for med_data in medications_data:
            existing_med = db.query(Medication).filter(Medication.drug_code == med_data["drug_code"]).first()
            if not existing_med:
                medication = Medication(**med_data)
                db.add(medication)
                print(f"✅ 薬剤追加: {med_data['drug_name']}")
            else:
                print(f"ℹ️ 薬剤既存: {med_data['drug_name']}")
        
        db.commit()
        
        # データ確認
        print("\n📊 作成されたデータ数:")
        user_count = db.query(User).count()
        patient_count = db.query(Patient).count()
        encounter_count = db.query(Encounter).count()
        medication_count = db.query(Medication).count()
        
        print(f"  👤 ユーザー: {user_count}件")
        print(f"  👥 患者: {patient_count}件") 
        print(f"  📋 診療記録: {encounter_count}件")
        print(f"  💊 薬剤: {medication_count}件")
        
        print("\n🎉 完全なデモデータ作成完了！")
        print("\n📋 ログイン情報:")
        print("  ユーザー名: demo")
        print("  パスワード: demo123")
        
        return True
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_data()