# EHR MVP セットアップガイド

このガイドでは、EHR MVPシステムのフロントエンドとバックエンドを立ち上げる手順を説明します。

## 📋 前提条件

- Python 3.11以上
- Node.js 18以上
- npm または yarn
- Git

## 🚀 クイックスタート

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd EHR_MVP
```

### 2. バックエンドのセットアップ

#### 2.1 Python仮想環境の作成

```bash
cd backend
python -m venv venv
```

#### 2.2 仮想環境の有効化

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

#### 2.3 依存関係のインストール

```bash
pip install -r requirements.txt
```

#### 2.4 環境変数の設定

```bash
# .envファイルを作成
cp .env.example .env  # .env.exampleがない場合は新規作成

# .envファイルを編集
```

`.env`ファイルの内容例：
```env
# Database
DATABASE_URL=sqlite:///./ehr_mvp.db

# JWT Settings
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Azure OpenAI (オプション)
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name

# CORS Settings
FRONTEND_URL=http://localhost:3000
```

#### 2.5 データベースのセットアップ

```bash
# データベースマイグレーションの実行
alembic upgrade head

# 初期データの投入（オプション）
python create_demo_user.py
python create_sample_data.py
python create_sample_medications.py
```

#### 2.6 バックエンドの起動

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

バックエンドは http://localhost:8000 で起動します。
APIドキュメントは http://localhost:8000/docs で確認できます。

### 3. フロントエンドのセットアップ

新しいターミナルウィンドウを開いて以下を実行：

#### 3.1 フロントエンドディレクトリへ移動

```bash
cd frontend
```

#### 3.2 依存関係のインストール

```bash
npm install
# または
yarn install
```

#### 3.3 環境変数の設定

```bash
# .envファイルを作成
cp .env.example .env  # .env.exampleがない場合は新規作成
```

`.env`ファイルの内容例：
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
```

#### 3.4 フロントエンドの起動

```bash
npm start
# または
yarn start
```

フロントエンドは http://localhost:3000 で起動します。

## 🧪 動作確認

### 1. ブラウザでアクセス

1. ブラウザで http://localhost:3000 を開く
2. ログイン画面が表示されることを確認

### 2. デモユーザーでログイン

デモデータを投入した場合：
- **ユーザー名**: demo_doctor
- **パスワード**: demo123

### 3. 基本機能の確認

- 患者一覧の表示
- 新規患者の登録
- 診療記録の作成
- 処方箋の作成

## 🐛 トラブルシューティング

### ポートが既に使用されている場合

**バックエンド:**
```bash
# 別のポートで起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**フロントエンド:**
```bash
# 別のポートで起動
PORT=3001 npm start
```

### データベース接続エラー

1. データベースURLが正しく設定されているか確認
2. SQLiteの場合、ファイルパスが正しいか確認
3. PostgreSQLの場合、サービスが起動しているか確認

### CORS エラー

1. バックエンドの`.env`で`FRONTEND_URL`が正しく設定されているか確認
2. フロントエンドの`.env`で`REACT_APP_API_URL`が正しく設定されているか確認

### 依存関係のインストールエラー

**Python:**
```bash
# pipをアップグレード
pip install --upgrade pip

# 個別にインストール
pip install fastapi uvicorn sqlalchemy alembic
```

**Node.js:**
```bash
# npmキャッシュをクリア
npm cache clean --force

# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## 🛑 サービスの停止

### バックエンドの停止
`Ctrl + C` を押す

### フロントエンドの停止
`Ctrl + C` を押す

## 📝 開発のヒント

### ホットリロード
- バックエンド: `--reload`オプションでコード変更時に自動リロード
- フロントエンド: React開発サーバーは自動的にホットリロード

### ログの確認
- バックエンド: ターミナルに直接出力
- フロントエンド: ブラウザの開発者ツールのコンソール

### データベースの確認
```bash
# SQLiteの場合
sqlite3 ehr_mvp.db
.tables
.schema
```

### APIのテスト
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔄 日常的な操作

### 新しい変更を取り込む
```bash
git pull origin master
cd backend && pip install -r requirements.txt
cd ../frontend && npm install
```

### データベースのリセット
```bash
cd backend
rm ehr_mvp.db  # SQLiteの場合
alembic upgrade head
python create_demo_user.py
```

### ログのクリア
```bash
# バックエンドログ
rm -rf backend/logs/*

# フロントエンドビルドキャッシュ
rm -rf frontend/.cache
```

## 🚀 本番環境へのデプロイ準備

1. 環境変数を本番用に設定
2. `SECRET_KEY`を安全な値に変更
3. データベースを本番用に設定（PostgreSQL推奨）
4. HTTPS証明書の設定
5. 適切なロギング設定

詳細は[デプロイメントガイド](./DEPLOYMENT.md)を参照してください。