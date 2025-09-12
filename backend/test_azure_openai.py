#!/usr/bin/env python3
"""
Azure OpenAI API接続テストスクリプト
"""

import asyncio
import sys
import os
sys.path.append('/Users/naoto/EHR_MVP/backend')

from app.services.ai_assistant_service import AIAssistantService


async def test_azure_openai():
    """Azure OpenAI APIの接続をテスト"""
    
    print("=== Azure OpenAI API 接続テスト ===")
    
    # AIAssistantServiceのインスタンス作成
    service = AIAssistantService()
    
    # 設定の確認
    print(f"Azure OpenAI Endpoint: {service.azure_openai_endpoint}")
    print(f"Azure OpenAI Key: {'設定済み' if service.azure_openai_key else '未設定'}")
    print(f"Deployment Name: {service.deployment_name}")
    print(f"API Version: {service.azure_openai_version}")
    print()
    
    if not service.azure_openai_key:
        print("❌ Azure OpenAI APIキーが設定されていません")
        print("   ~/.azure/auth.json を確認してください")
        return
    
    # テストテキスト
    test_text = "患者の田中太郎さん（患者ID: P123456、TEL: 03-1234-5678）は発熱と頭痛の症状があります。体温は38.5度で、血圧は120/80です。"
    
    print("テストテキスト:")
    print(f"  {test_text}")
    print()
    
    try:
        # セーフティチェックのテスト
        print("🔍 セーフティチェック実行中...")
        result = await service.process_medical_text(
            text=test_text,
            context={"operation": "test", "user_id": "test_user"}
        )
        
        print("✅ セーフティチェック完了!")
        print(f"   リスクレベル: {result.risk_level}")
        print(f"   実行アクション: {result.action_taken}")
        print(f"   信頼度: {result.confidence_score:.2f}")
        print(f"   検知問題数: {len(result.detected_issues)}")
        
        if result.processed_text != test_text:
            print(f"   処理後テキスト: {result.processed_text}")
        
        print(f"   処理時間: {result.processing_time_ms}ms")
        
        # 検知された問題の詳細
        if result.detected_issues:
            print("\n🔍 検知された問題:")
            for issue in result.detected_issues:
                print(f"   - {issue.get('type', 'N/A')}: {issue.get('description', 'N/A')}")
        
        print(f"\n📝 監査ハッシュ: {result.audit_hash}")
        
    except Exception as e:
        print(f"❌ テストエラー: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print("\n=== テスト完了 ===")


async def test_api_endpoints():
    """API エンドポイントのテスト"""
    
    print("\n=== API エンドポイントテスト ===")
    
    import httpx
    
    # 認証トークンを取得
    auth_data = {
        "username": "demo",
        "password": "demo123"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            # ログイン
            auth_response = await client.post("http://localhost:8000/api/v1/auth/login", json=auth_data)
            if auth_response.status_code != 200:
                print(f"❌ 認証失敗: {auth_response.status_code}")
                return
            
            token = auth_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # セーフティチェックのテスト
            safety_data = {
                "text": "患者の田中太郎さん（患者ID: P123456）は発熱の症状があります。",
                "context": {"operation": "test"}
            }
            
            print("🔍 セーフティチェックAPI テスト...")
            safety_response = await client.post(
                "http://localhost:8000/api/v1/ai-assistant/safety-check",
                json=safety_data,
                headers=headers
            )
            
            if safety_response.status_code == 200:
                result = safety_response.json()
                print("✅ セーフティチェックAPI成功!")
                print(f"   リスクレベル: {result.get('risk_level', 'N/A')}")
                print(f"   実行アクション: {result.get('action_taken', 'N/A')}")
                if result.get('processed_text') != safety_data['text']:
                    print(f"   処理後: {result.get('processed_text', 'N/A')}")
            else:
                print(f"❌ セーフティチェックAPI失敗: {safety_response.status_code}")
                print(f"   レスポンス: {safety_response.text}")
    
    except Exception as e:
        print(f"❌ APIテストエラー: {str(e)}")


if __name__ == "__main__":
    asyncio.run(test_azure_openai())
    asyncio.run(test_api_endpoints())