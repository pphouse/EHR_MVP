#!/usr/bin/env python3
"""
アンサンブル診断システムのテストスクリプト
"""
import os
import sys
import asyncio
import json
from datetime import datetime

# バックエンドのパスを追加
sys.path.insert(0, '/home/user/EHR_MVP/backend')

from app.services.cerebras_service import CerebrasService

# 環境変数をロード
from dotenv import load_dotenv
load_dotenv('/home/user/EHR_MVP/.env')


async def test_ensemble_diagnosis():
    """アンサンブル診断のテスト"""

    print("=" * 80)
    print("アンサンブル診断システムのテスト")
    print("=" * 80)
    print()

    # Cerebrasサービスの初期化
    cerebras_service = CerebrasService()

    # APIキーの確認
    api_key = os.getenv("CEREBRAS_API_KEY")
    if not api_key:
        print("❌ エラー: CEREBRAS_API_KEY が設定されていません")
        return

    print(f"✅ Cerebras API Key: {api_key[:20]}...")
    print(f"✅ Client initialized: {cerebras_service.client is not None}")
    print()

    # テスト用の臨床データ
    test_data = {
        'basic_info': {
            'age': 45,
            'gender': '男性',
            'medical_history': '高血圧、2型糖尿病（5年前から治療中）'
        },
        'vitals': {
            'temperature': 38.5,
            'blood_pressure_systolic': 145,
            'blood_pressure_diastolic': 90,
            'heart_rate': 95,
            'respiratory_rate': 18,
            'oxygen_saturation': 96
        },
        'subjective': '3日前から発熱、咳、全身倦怠感を訴えている。食欲不振もあり。昨日から黄色い痰も出るようになった。',
        'objective': '胸部聴診で右下肺野にcoarse cracklesを聴取。咽頭発赤あり。頸部リンパ節腫脹なし。',
        'patient_history': []
    }

    print("📋 テストケース: 市中肺炎が疑われる症例")
    print("-" * 80)
    print(f"患者: {test_data['basic_info']['age']}歳 {test_data['basic_info']['gender']}")
    print(f"既往歴: {test_data['basic_info']['medical_history']}")
    print(f"主訴: 発熱、咳、全身倦怠感")
    print(f"バイタル: 体温 {test_data['vitals']['temperature']}°C, BP {test_data['vitals']['blood_pressure_systolic']}/{test_data['vitals']['blood_pressure_diastolic']}")
    print()

    try:
        print("🤖 3つのLLMで診断を生成中...")
        print("   - Qwen 3 235B Instruct")
        print("   - Llama 3.3 70B")
        print("   - OpenAI GPT OSS")
        print()

        start_time = datetime.now()

        # アンサンブル診断を実行
        result = await cerebras_service.generate_ensemble_diagnosis(test_data)

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        print(f"✅ 診断完了（所要時間: {duration:.2f}秒）")
        print()

        # 結果の表示
        print("=" * 80)
        print("📊 最終診断結果")
        print("=" * 80)
        print()

        print(f"【状況要約】")
        print(f"{result.final_summary}")
        print()

        print(f"【重要所見】")
        for i, finding in enumerate(result.final_key_findings, 1):
            print(f"  {i}. {finding}")
        print()

        print(f"【鑑別診断】")
        for i, diagnosis in enumerate(result.final_differential_diagnoses, 1):
            print(f"  {i}. {diagnosis.get('diagnosis', 'N/A')}")
            print(f"     確率: {diagnosis.get('probability', 0):.2%}")
            print(f"     根拠: {', '.join(diagnosis.get('supporting_evidence', []))}")
            if 'additional_tests' in diagnosis:
                print(f"     推奨検査: {', '.join(diagnosis.get('additional_tests', []))}")
            print()

        print(f"【リスク要因】")
        for i, risk in enumerate(result.final_risk_factors, 1):
            print(f"  {i}. {risk}")
        print()

        print(f"【推奨事項】")
        for i, rec in enumerate(result.final_recommendations, 1):
            print(f"  {i}. {rec}")
        print()

        print("=" * 80)
        print("📈 アンサンブル評価")
        print("=" * 80)
        print()

        print(f"信頼度スコア: {result.final_confidence_score:.2%}")
        print(f"コンセンサスレベル: {result.consensus_level:.2%}")
        print(f"使用モデル数: {len(result.individual_results)}")
        print()

        print(f"【統合の推論】")
        print(f"{result.synthesis_reasoning}")
        print()

        # 個別モデルの結果
        print("=" * 80)
        print("🔍 個別モデルの結果")
        print("=" * 80)
        print()

        for i, model_result in enumerate(result.individual_results, 1):
            print(f"【モデル{i}: {model_result.model_name}】")
            print(f"信頼度: {model_result.confidence_score:.2%}")
            print(f"要約: {model_result.summary}")
            print(f"推論: {model_result.reasoning[:200]}..." if len(model_result.reasoning) > 200 else f"推論: {model_result.reasoning}")
            print()

        # JSONファイルに保存
        output_file = '/home/user/EHR_MVP/test_ensemble_result.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                'final_summary': result.final_summary,
                'final_key_findings': result.final_key_findings,
                'final_differential_diagnoses': result.final_differential_diagnoses,
                'final_risk_factors': result.final_risk_factors,
                'final_recommendations': result.final_recommendations,
                'final_confidence_score': result.final_confidence_score,
                'consensus_level': result.consensus_level,
                'synthesis_reasoning': result.synthesis_reasoning,
                'individual_results': [
                    {
                        'model_name': r.model_name,
                        'summary': r.summary,
                        'confidence_score': r.confidence_score,
                        'key_findings': r.key_findings,
                        'differential_diagnoses': r.differential_diagnoses,
                        'reasoning': r.reasoning
                    }
                    for r in result.individual_results
                ],
                'duration_seconds': duration
            }, f, ensure_ascii=False, indent=2)

        print(f"✅ 詳細結果を保存: {output_file}")
        print()

        # テスト成功
        print("=" * 80)
        print("✅ テスト成功！")
        print("=" * 80)

    except Exception as e:
        print()
        print("=" * 80)
        print("❌ エラーが発生しました")
        print("=" * 80)
        print()
        print(f"エラーメッセージ: {str(e)}")
        print()
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_ensemble_diagnosis())
