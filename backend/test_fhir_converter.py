#!/usr/bin/env python
"""
FHIR変換機能のテストスクリプト
"""
import asyncio
import json
from app.services.fhir_converter_service_v2 import SimpleFHIRConverterService as FHIRConverterService

async def test_fhir_conversion():
    print("Azure OpenAI key loaded from /Users/naoto/.azure/auth.json")
    service = FHIRConverterService()
    
    # テスト用患者データ
    patient_data = {
        'id': 1,
        'patient_id': 'P001',
        'family_name': '山田',
        'given_name': '太郎',
        'gender': 'male',
        'birth_date': '1980-01-01',
        'phone': '090-1234-5678'
    }
    
    print("=== Step 1: FHIR Patient Resource Conversion ===")
    try:
        patient = await service.convert_patient_to_fhir(patient_data)
        print("✅ Patient conversion successful")
        print(json.dumps(patient, ensure_ascii=False, indent=2)[:500] + "...")  # 最初の500文字のみ表示
    except Exception as e:
        print(f"❌ Patient conversion failed: {e}")
    
    # 医療情報の抽出テスト
    medical_text = '''
    患者は38歳男性。主訴は頭痛と発熱。
    診断：上気道炎、慢性胃炎
    アレルギー：ペニシリン（重度の発疹）、アスピリン（軽度）
    感染症：インフルエンザA型（2024年1月、回復済み）
    薬剤禁忌：ワルファリン（出血リスク）
    検査結果：WBC 12000/μL（基準値：4000-9000）、CRP 3.5mg/dL（基準値：<0.3）、体温 38.2℃
    処方：アセトアミノフェン 500mg 1日3回 5日分、ファモチジン 20mg 1日2回 14日分
    '''
    
    print("\n=== Step 2: Medical Information Extraction ===")
    try:
        extracted = await service.extract_medical_info(medical_text)
        print("✅ Medical info extraction successful")
        print(json.dumps(extracted, ensure_ascii=False, indent=2))
        
        # 統計情報
        print("\n📊 Extraction Statistics:")
        print(f"- Diagnoses: {len(extracted.get('diagnoses', []))}")
        print(f"- Allergies: {len(extracted.get('allergies', []))}")
        print(f"- Infections: {len(extracted.get('infections', []))}")
        print(f"- Contraindications: {len(extracted.get('contraindications', []))}")
        print(f"- Lab Results: {len(extracted.get('labResults', []))}")
        print(f"- Prescriptions: {len(extracted.get('prescriptions', []))}")
        
    except Exception as e:
        print(f"❌ Medical info extraction failed: {e}")
    
    # 完全なFHIRバンドル作成テスト
    print("\n=== Step 3: Complete FHIR Bundle Creation ===")
    encounter_data = {
        'id': 1,
        'encounter_id': 'E001',
        'patient_id': 1,
        'status': 'finished',
        'encounter_class': 'AMB',
        'start_time': '2024-01-15T10:00:00',
        'end_time': '2024-01-15T11:00:00',
        'chief_complaint': '頭痛と発熱'
    }
    
    try:
        bundle = await service.create_fhir_bundle(
            patient_data=patient_data,
            encounter_data=encounter_data,
            medical_text=medical_text
        )
        print("✅ FHIR bundle creation successful")
        print(f"Bundle ID: {bundle.get('id')}")
        print(f"Resource count: {len(bundle.get('entry', []))}")
        
        # バリデーション
        validation = await service.validate_fhir_bundle(bundle)
        print(f"\n📋 Validation Result: {'✅ Valid' if validation['is_valid'] else '❌ Invalid'}")
        if validation['errors']:
            print(f"Errors: {validation['errors']}")
        if validation['warnings']:
            print(f"Warnings: {validation['warnings']}")
            
    except Exception as e:
        print(f"❌ FHIR bundle creation failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_fhir_conversion())