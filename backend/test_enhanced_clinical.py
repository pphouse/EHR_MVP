#!/usr/bin/env python
"""
Enhanced Clinical Assistant のテストスクリプト
"""
import asyncio
import json
from app.services.enhanced_pii_service import EnhancedPIIService
from app.services.clinical_assistant_service import ClinicalAssistantService

async def test_enhanced_pii():
    print("=== Enhanced PII Detection テスト ===")
    
    service = EnhancedPIIService()
    
    test_cases = [
        {
            'name': 'Azure OpenAI PII検知テスト',
            'text': '患者の田中太郎さん（患者番号：P123456、電話番号：090-1234-5678）は38歳男性です。',
            'masking_level': 'standard'
        },
        {
            'name': '医療文脈理解テスト',
            'text': '患者は上気道炎と診断されています。ペニシリンアレルギーがあります。',
            'masking_level': 'minimal'
        },
        {
            'name': '最大マスキングテスト',
            'text': '佐藤花子さん（生年月日：1985年3月15日）の検査結果です。',
            'masking_level': 'maximum'
        }
    ]
    
    for case in test_cases:
        print(f"\n--- {case['name']} ---")
        print(f"元のテキスト: {case['text']}")
        
        # PII検知
        detections = await service.detect_pii_with_context(case['text'], medical_context=True)
        print(f"検知されたPII: {len(detections)}件")
        
        for detection in detections:
            print(f"  - {detection.pii_type}: {detection.text} → {detection.masked_text} (信頼度: {detection.confidence:.2f})")
            print(f"    理由: {detection.reasoning}")
        
        # 適応的マスキング
        masked_text, _ = await service.smart_masking(case['text'], case['masking_level'])
        print(f"マスキング後: {masked_text}")
        
        # リスク分析
        risk_analysis = await service.analyze_pii_risk(case['text'])
        print(f"リスクレベル: {risk_analysis['risk_level']}")
        print(f"リスクスコア: {risk_analysis['overall_risk_score']:.2f}")
        
        print("✅ 完了")

async def test_clinical_assistant():
    print("\n=== Clinical Assistant テスト ===")
    
    service = ClinicalAssistantService()
    
    # 患者状況整理テスト
    print("\n--- 患者状況整理テスト ---")
    clinical_data = {
        'basic_info': {
            'age': 42,
            'gender': 'female',
            'medical_history': '高血圧、糖尿病の既往あり'
        },
        'vitals': {
            'temperature': 38.2,
            'blood_pressure_systolic': 140,
            'blood_pressure_diastolic': 90,
            'heart_rate': 95,
            'respiratory_rate': 20,
            'oxygen_saturation': 98
        },
        'subjective': '3日前から発熱と咳嗽が続いている。食欲不振あり。倦怠感が強い。',
        'objective': '発熱あり。咽頭発赤軽度。肺音清明。心音正常。腹部異常なし。'
    }
    
    situation = await service.generate_patient_summary(clinical_data)
    print(f"要約: {situation.summary}")
    print(f"重要所見: {situation.key_findings}")
    print(f"鑑別診断数: {len(situation.differential_diagnoses)}")
    print(f"推奨事項数: {len(situation.recommendations)}")
    print(f"信頼度: {situation.confidence_score:.2f}")
    
    if situation.differential_diagnoses:
        print("鑑別診断:")
        for dx in situation.differential_diagnoses:
            print(f"  - {dx.get('diagnosis', 'N/A')} (確率: {dx.get('probability', 0):.1f})")
    
    # A&P整合性チェックテスト
    print("\n--- A&P整合性チェックテスト ---")
    
    validation_cases = [
        {
            'name': '整合性の高いケース',
            'patient_summary': situation.summary,
            'assessment': '上気道炎の診断。症状と身体所見が一致している。',
            'plan': '対症療法として解熱剤処方。水分摂取を促し、3日後に再診。',
            'diagnosis_codes': ['J00']
        },
        {
            'name': '不整合のあるケース',
            'patient_summary': situation.summary,
            'assessment': '急性心筋梗塞の診断。緊急手術が必要。',
            'plan': '心臓カテーテル検査を実施。CCU入室。',
            'diagnosis_codes': ['I21.9']
        }
    ]
    
    for case in validation_cases:
        print(f"\n{case['name']}:")
        validation = await service.validate_clinical_reasoning(
            patient_summary=case['patient_summary'],
            assessment=case['assessment'],
            plan=case['plan'],
            diagnosis_codes=case['diagnosis_codes']
        )
        
        print(f"  整合性: {validation.is_consistent}")
        print(f"  整合性スコア: {validation.consistency_score:.2f}")
        print(f"  不整合数: {len(validation.inconsistencies)}")
        
        if validation.inconsistencies:
            print("  不整合内容:")
            for inconsistency in validation.inconsistencies:
                print(f"    - {inconsistency.get('type', 'N/A')}: {inconsistency.get('description', 'N/A')}")
        
        if validation.suggestions:
            print("  改善提案:")
            for suggestion in validation.suggestions[:2]:  # 最初の2つのみ表示
                print(f"    - {suggestion}")
    
    print("✅ Clinical Assistant テスト完了")

async def main():
    print("Enhanced Clinical Assistant 機能テスト開始\n")
    
    try:
        await test_enhanced_pii()
        await test_clinical_assistant()
        
        print("\n🎉 全てのテストが正常に完了しました！")
        
    except Exception as e:
        print(f"\n❌ テスト中にエラーが発生しました: {e}")

if __name__ == "__main__":
    asyncio.run(main())