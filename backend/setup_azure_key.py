#!/usr/bin/env python3
"""
Azure OpenAI APIキーのセキュアな設定スクリプト

使用方法:
    python setup_azure_key.py

これにより、APIキーを ~/.azure/auth.json に安全に保存します。
"""

import os
import json
from pathlib import Path
import stat
import getpass


def setup_azure_key():
    """Azure OpenAI APIキーをセキュアに設定"""
    
    # ディレクトリパスの準備
    azure_dir = Path.home() / ".azure"
    auth_file = azure_dir / "auth.json"
    
    print("=== Azure OpenAI API Key Setup ===")
    print(f"認証情報は以下のファイルに保存されます: {auth_file}")
    print()
    
    # 既存の認証情報を確認
    existing_auth = {}
    if auth_file.exists():
        try:
            with open(auth_file, 'r') as f:
                existing_auth = json.load(f)
                existing_key = existing_auth.get("azure_openai_key") or existing_auth.get("AZURE_OPENAI_KEY")
                if existing_key:
                    print(f"既存のAPIキーが見つかりました（最初の8文字: {existing_key[:8]}...）")
                    overwrite = input("上書きしますか？ (y/N): ").lower()
                    if overwrite != 'y':
                        print("セットアップをキャンセルしました。")
                        return
        except Exception as e:
            print(f"既存の認証ファイルの読み取りエラー: {e}")
    
    # APIキーの入力（非表示）
    print("\nAzure OpenAI APIキーを入力してください（表示されません）:")
    api_key = getpass.getpass("API Key: ").strip()
    
    if not api_key:
        print("APIキーが入力されませんでした。")
        return
    
    # 確認のため再入力
    confirm_key = getpass.getpass("確認のため再度入力してください: ").strip()
    
    if api_key != confirm_key:
        print("入力されたキーが一致しません。")
        return
    
    try:
        # ディレクトリの作成（存在しない場合）
        azure_dir.mkdir(exist_ok=True)
        
        # 既存の認証情報を保持しつつ、APIキーを更新
        existing_auth["azure_openai_key"] = api_key
        
        # ファイルに書き込み
        with open(auth_file, 'w') as f:
            json.dump(existing_auth, f, indent=2)
        
        # ファイルの権限を制限（所有者のみ読み書き可能）
        os.chmod(auth_file, stat.S_IRUSR | stat.S_IWUSR)
        
        print(f"\n✅ APIキーが正常に保存されました: {auth_file}")
        print("📝 権限: 所有者のみ読み書き可能")
        
        # .gitignoreに追加を推奨
        gitignore_path = Path.home() / ".gitignore"
        print(f"\n⚠️  重要: {gitignore_path} に以下を追加することを推奨します:")
        print("    .azure/")
        print("    .azure/*")
        
    except Exception as e:
        print(f"\n❌ エラー: APIキーの保存に失敗しました: {e}")
        return
    
    print("\n=== セットアップ完了 ===")
    print("バックエンドを再起動すると、新しいAPIキーが自動的に読み込まれます。")


if __name__ == "__main__":
    setup_azure_key()