#!/usr/bin/env python3
"""
Sample data creation script for EHR MVP
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from datetime import date, datetime

def create_demo_user(db: Session):
    """Create demo user if not exists"""
    existing_user = db.query(User).filter(User.username == "demo").first()
    if existing_user:
        print("Demo user already exists")
        return existing_user
    
    demo_user = User(
        username="demo",
        email="demo@example.com",
        full_name="Demo User",
        hashed_password=get_password_hash("demo123"),
        is_active=True,
        is_verified=True,
        role=UserRole.DOCTOR
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)
    print("Demo user created successfully")
    return demo_user

def create_sample_patients(db: Session):
    """Create sample patients"""
    sample_patients = [
        {
            "patient_id": "P000001",
            "first_name": "太郎",
            "last_name": "田中",
            "first_name_kana": "タロウ",
            "last_name_kana": "タナカ",
            "date_of_birth": date(1978, 5, 15),
            "gender": "male",
            "phone": "090-1234-5678",
            "email": "tanaka.taro@example.com",
            "address": "東京都新宿区1-1-1",
            "emergency_contact_name": "田中花子",
            "emergency_contact_phone": "090-1234-5679"
        },
        {
            "patient_id": "P000002",
            "first_name": "花子",
            "last_name": "佐藤",
            "first_name_kana": "ハナコ",
            "last_name_kana": "サトウ",
            "date_of_birth": date(1985, 12, 3),
            "gender": "female",
            "phone": "080-2345-6789",
            "email": "sato.hanako@example.com",
            "address": "東京都渋谷区2-2-2",
            "emergency_contact_name": "佐藤次郎",
            "emergency_contact_phone": "080-2345-6790"
        },
        {
            "patient_id": "P000003",
            "first_name": "次郎",
            "last_name": "山田",
            "first_name_kana": "ジロウ",
            "last_name_kana": "ヤマダ",
            "date_of_birth": date(1956, 8, 22),
            "gender": "male",
            "phone": "070-3456-7890",
            "email": "yamada.jiro@example.com",
            "address": "東京都港区3-3-3",
            "emergency_contact_name": "山田美子",
            "emergency_contact_phone": "070-3456-7891"
        },
        {
            "patient_id": "P000004",
            "first_name": "美子",
            "last_name": "鈴木",
            "first_name_kana": "ヨシコ",
            "last_name_kana": "スズキ",
            "date_of_birth": date(1992, 3, 10),
            "gender": "female",
            "phone": "060-4567-8901",
            "email": "suzuki.yoshiko@example.com",
            "address": "東京都世田谷区4-4-4",
            "emergency_contact_name": "鈴木一郎",
            "emergency_contact_phone": "060-4567-8902"
        }
    ]
    
    created_patients = []
    for patient_data in sample_patients:
        # Check if patient already exists
        existing_patient = db.query(Patient).filter(Patient.patient_id == patient_data["patient_id"]).first()
        if existing_patient:
            print(f"Patient {patient_data['patient_id']} already exists")
            created_patients.append(existing_patient)
            continue
        
        patient = Patient(**patient_data)
        db.add(patient)
        created_patients.append(patient)
        print(f"Created patient: {patient_data['patient_id']} - {patient_data['last_name']} {patient_data['first_name']}")
    
    db.commit()
    for patient in created_patients:
        db.refresh(patient)
    
    return created_patients

def main():
    print("Creating sample data for EHR MVP...")
    
    # Create database tables
    from app.models import patient, user
    
    db = SessionLocal()
    try:
        # Create demo user
        demo_user = create_demo_user(db)
        
        # Create sample patients
        patients = create_sample_patients(db)
        
        print(f"\nSample data creation completed!")
        print(f"- Demo user: {demo_user.username}")
        print(f"- Patients created: {len(patients)}")
        
        for patient in patients:
            print(f"  - {patient.patient_id}: {patient.last_name} {patient.first_name}")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()