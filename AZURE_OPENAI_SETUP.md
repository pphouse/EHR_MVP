# Azure OpenAI API セットアップガイド

## セキュアな認証情報の管理

このシステムは、Azure OpenAI APIキーを安全に管理するため、`~/.azure/auth.json` から認証情報を読み取ります。

## セットアップ手順

### 1. 自動セットアップ（推奨）

```bash
cd backend
python setup_azure_key.py
```

このスクリプトは以下を実行します：
- APIキーの安全な入力（画面に表示されません）
- `~/.azure/auth.json` への保存
- 適切なファイル権限の設定（所有者のみ読み書き可能）

### 2. 手動セットアップ

```bash
# ディレクトリ作成
mkdir -p ~/.azure

# auth.json ファイルを作成
cat > ~/.azure/auth.json << EOF
{
  "azure_openai_key": "your-actual-api-key-here"
}
EOF

# ファイル権限を設定
chmod 600 ~/.azure/auth.json
```

## auth.json の構造

```json
{
  "azure_openai_key": "your-actual-api-key",
  "azure_openai_endpoint": "https://your-resource.openai.azure.com/",
  "other_azure_credentials": "..."
}
```

## 認証情報の読み取り優先順位

1. `~/.azure/auth.json` の `azure_openai_key` フィールド
2. 環境変数 `AZURE_OPENAI_KEY`
3. `.env` ファイル（非推奨）

## セキュリティのベストプラクティス

### ✅ やるべきこと

1. **~/.gitignore に追加**
   ```
   .azure/
   .azure/*
   ```

2. **定期的なキーローテーション**
   - Azure Portalで定期的にAPIキーを更新
   - `setup_azure_key.py` で新しいキーを設定

3. **権限の確認**
   ```bash
   ls -la ~/.azure/auth.json
   # -rw------- (600) であることを確認
   ```

### ❌ やってはいけないこと

1. APIキーをソースコードに直接記述
2. APIキーをGitリポジトリにコミット
3. APIキーを平文でメールやチャットで共有

## Azure OpenAI リソースの設定

### 1. Azure Portalでリソース作成

1. [Azure Portal](https://portal.azure.com) にログイン
2. "Azure OpenAI" を検索して選択
3. "作成" をクリック
4. 必要な情報を入力：
   - サブスクリプション
   - リソースグループ
   - リージョン（例: East US）
   - リソース名

### 2. デプロイメントの作成

1. 作成したAzure OpenAIリソースに移動
2. "Model deployments" → "Manage Deployments"
3. "Create new deployment" をクリック
4. モデルを選択（gpt-4 または gpt-35-turbo）
5. デプロイメント名を設定

### 3. APIキーとエンドポイントの取得

1. Azure OpenAIリソースの "Keys and Endpoint" セクション
2. KEY 1 または KEY 2 をコピー
3. Endpoint URLもメモ

### 4. .env ファイルの更新

```bash
# backend/.env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
```

## トラブルシューティング

### APIキーが読み込まれない場合

1. **ファイルの存在確認**
   ```bash
   ls -la ~/.azure/auth.json
   ```

2. **JSONフォーマットの確認**
   ```bash
   cat ~/.azure/auth.json | jq .
   ```

3. **バックエンドログの確認**
   ```bash
   # バックエンド起動時のログを確認
   python -m uvicorn app.main:app --reload
   ```

   以下のようなメッセージが表示されるはず：
   - `Azure OpenAI key loaded from /Users/naoto/.azure/auth.json`
   - または `Warning: Azure OpenAI key not found. AI features will use mock data.`

### 権限エラーの場合

```bash
# ファイル権限を修正
chmod 600 ~/.azure/auth.json

# 所有者を確認
ls -la ~/.azure/auth.json
```

## 動作確認

APIキーが正しく設定されていれば、AI機能が実際のAzure OpenAI APIを使用します：

1. **ハルシネーション検知**: 実際のGPTモデルによる検証
2. **診断補助**: AIによる鑑別診断の生成
3. **サマリー生成**: AIによる医療文書の要約

設定が完了したら、バックエンドを再起動して変更を反映させてください：

```bash
# バックエンドの再起動
kill $(lsof -t -i:8000)
cd backend && python -m uvicorn app.main:app --reload
```