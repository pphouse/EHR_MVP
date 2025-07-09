# EHR MVP セットアップガイド

このガイドでは、EHR MVPシステムのフロントエンドとバックエンドを立ち上げる手順を説明します。

## 📋 前提条件

- Python 3.11以上
- Node.js 18以上
- npm または yarn
- Git

## 🚀 推奨：自動セットアップ（最も簡単）

### macOS/Linux
```bash
./start-dev.sh
```

### Windows
```cmd
start-dev.bat
```

これにより：
- ✅ 依存関係の自動インストール
- ✅ Pydantic v2互換性の自動修正
- ✅ データベースの自動セットアップ
- ✅ 別々のターミナルでサービスを起動

## 📝 手動セットアップ（詳細な制御が必要な場合）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd EHR_MVP
```

### 2. バックエンドのセットアップ

#### 方法A: スクリプトを使用（推奨）
```bash
cd backend
./start-backend.sh
```

#### 方法B: 手動セットアップ

##### 2.1 Python仮想環境の作成

```bash
cd backend
python -m venv venv
```

##### 2.2 仮想環境の有効化

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

##### 2.3 依存関係のインストール

```bash
pip install -r requirements.txt
```

##### 2.4 環境変数の設定

`.env`ファイルを作成：
```env
# Database
DATABASE_URL=sqlite:///./ehr_mvp.db

# JWT Settings
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Azure OpenAI (オプション)
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name

# CORS Settings
FRONTEND_URL=http://localhost:3000
```

##### 2.5 Pydantic v2互換性の修正

`app/core/config.py`を編集：
```python
# 変更前
from pydantic import BaseSettings, validator

# 変更後
from pydantic_settings import BaseSettings
from pydantic import validator
```

スキーマファイルの`orm_mode`を`from_attributes`に変更

##### 2.6 データベースのセットアップ

```bash
# データベースマイグレーションの実行
alembic upgrade head

# 初期データの投入（オプション）
python create_demo_user.py
python create_sample_data.py
python create_sample_medications.py
```

##### 2.7 バックエンドの起動

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

バックエンドは http://localhost:8000 で起動します。
APIドキュメントは http://localhost:8000/docs で確認できます。

### 3. フロントエンドのセットアップ

新しいターミナルウィンドウを開いて：

#### 方法A: スクリプトを使用（推奨）
```bash
cd frontend
./start-frontend.sh
```

#### 方法B: 手動セットアップ

##### 3.1 フロントエンドディレクトリへ移動

```bash
cd frontend
```

##### 3.2 依存関係のインストール

```bash
npm install
# または
yarn install
```

##### 3.3 環境変数の設定

`.env`ファイルを作成：
```env
DANGEROUSLY_DISABLE_HOST_CHECK=true
SKIP_PREFLIGHT_CHECK=true
REACT_APP_API_URL=http://localhost:8000/api/v1
```

##### 3.4 フロントエンドの起動

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

### Network Error

「Network error. Please check your connection.」というエラーが表示される場合：

1. **バックエンドが起動しているか確認**
   ```bash
   # ポート8000が使用されているか確認
   lsof -i :8000
   
   # バックエンドのログを確認
   curl http://localhost:8000/docs
   ```

2. **別々のターミナルで起動**
   - ターミナル1: `cd backend && ./start-backend.sh`
   - ターミナル2: `cd frontend && ./start-frontend.sh`

3. **環境変数を確認**
   ```bash
   # frontend/.env
   REACT_APP_API_URL=http://localhost:8000/api/v1
   ```

4. **Pydanticのバージョン問題**
   config.pyのインポートを確認：
   ```python
   from pydantic_settings import BaseSettings
   from pydantic import validator
   ```

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

## 💡 よくある質問

### Q: ポートが既に使用されている
```bash
# ポート8000を使用しているプロセスを確認
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# プロセスを停止
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Q: デモユーザーでログインできない
デモデータを作成していない可能性があります：
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python create_demo_user.py
```

### Q: フロントエンドが真っ白になる
環境変数が正しく設定されているか確認：
```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

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
python create_sample_data.py
python create_sample_medications.py
```

### サービスの停止
- 自動起動スクリプト使用時: 各ターミナルウィンドウを閉じる
- 手動起動時: 各ターミナルで `Ctrl+C`

## 📊 ログの確認

### バックエンドログ
- ターミナルに直接表示
- エラーは赤色で表示

### フロントエンドログ
- ブラウザの開発者ツール（F12）→ コンソール

## 🚀 本番環境へのデプロイ準備

1. **環境変数を本番用に設定**
   - `SECRET_KEY`を安全なランダム値に変更
   - `DATABASE_URL`を本番データベースに設定
   - `DEBUG=False`を設定

2. **セキュリティ設定**
   - HTTPS証明書の設定
   - CORS設定の見直し
   - ファイアウォール設定

3. **パフォーマンス最適化**
   - Gunicornなどの本番用WSGIサーバーを使用
   - Nginxでリバースプロキシ設定
   - 静的ファイルの配信最適化

## 🆘 サポート

問題が解決しない場合：
1. エラーメッセージをコピー
2. `backend/logs/`のログファイルを確認
3. GitHubのIssuesで報告