#!/usr/bin/env python3
"""
Azure OpenAIのデプロイメントを確認するスクリプト
"""

import requests
import json
import sys
from pathlib import Path

# auth.jsonからAPIキーを読み込む
auth_path = Path.home() / ".azure" / "auth.json"
if auth_path.exists():
    with open(auth_path, 'r') as f:
        auth_data = json.load(f)
        api_key = auth_data.get("azure_openai_key")
else:
    print("❌ ~/.azure/auth.json が見つかりません")
    sys.exit(1)

if not api_key:
    print("❌ APIキーが設定されていません")
    sys.exit(1)

# エンドポイント
endpoint = "https://med-azure-openai-api.openai.azure.com/"

# ヘッダー
headers = {
    "api-key": api_key,
    "Content-Type": "application/json"
}

print("=== Azure OpenAI デプロイメント確認 ===")
print(f"エンドポイント: {endpoint}")
print(f"APIキー: 設定済み（最初の8文字: {api_key[:8]}...）")
print()

# デプロイメント一覧を取得
try:
    # デプロイメント一覧エンドポイント
    deployments_url = f"{endpoint}openai/deployments?api-version=2023-05-15"
    
    print(f"🔍 デプロイメント一覧を取得中...")
    print(f"URL: {deployments_url}")
    
    response = requests.get(deployments_url, headers=headers)
    
    print(f"ステータスコード: {response.status_code}")
    
    if response.status_code == 200:
        deployments = response.json()
        print(f"\n✅ 利用可能なデプロイメント:")
        
        if 'data' in deployments:
            for deployment in deployments['data']:
                print(f"  - 名前: {deployment.get('id', 'N/A')}")
                print(f"    モデル: {deployment.get('model', 'N/A')}")
                print(f"    状態: {deployment.get('status', 'N/A')}")
                print()
        else:
            print("  デプロイメントが見つかりませんでした")
            print(f"  レスポンス: {json.dumps(deployments, indent=2)}")
    else:
        print(f"❌ エラー: {response.status_code}")
        print(f"レスポンス: {response.text}")
        
except Exception as e:
    print(f"❌ 接続エラー: {str(e)}")

# テスト用のChatCompletion APIを試す
print("\n=== ChatCompletion APIテスト ===")

# 一般的なデプロイメント名を試す
deployment_names = ["gpt-35-turbo", "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"]

for deployment_name in deployment_names:
    print(f"\n🔍 デプロイメント '{deployment_name}' をテスト中...")
    
    chat_url = f"{endpoint}openai/deployments/{deployment_name}/chat/completions?api-version=2023-05-15"
    
    test_data = {
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello"}
        ],
        "max_tokens": 10
    }
    
    try:
        response = requests.post(chat_url, headers=headers, json=test_data)
        
        if response.status_code == 200:
            print(f"✅ 成功! デプロイメント '{deployment_name}' が利用可能です")
            result = response.json()
            print(f"   レスポンス: {result.get('choices', [{}])[0].get('message', {}).get('content', 'N/A')}")
            break
        elif response.status_code == 404:
            print(f"❌ デプロイメント '{deployment_name}' が見つかりません")
        else:
            print(f"❌ エラー {response.status_code}: {response.text[:100]}...")
            
    except Exception as e:
        print(f"❌ 接続エラー: {str(e)}")

print("\n=== 確認完了 ===")