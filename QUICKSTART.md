# EHR MVP クイックスタート

## 🚀 最速で起動する方法

### 自動起動スクリプトを使用

#### macOS/Linux
```bash
./start-dev.sh
```

#### Windows
```cmd
start-dev.bat
```

これで自動的に：
- 必要な依存関係がインストールされます
- Pydantic v2の互換性問題を修正します
- データベースがセットアップされます
- バックエンドとフロントエンドが**別々のターミナルで**起動します

## 🌐 アクセスURL

- **アプリケーション**: http://localhost:3000
- **API ドキュメント**: http://localhost:8000/docs

## 🔑 デモアカウント

デモデータを作成した場合：
- **ユーザー名**: demo_doctor
- **パスワード**: demo123

## ⚡ 手動で個別に起動

### バックエンドのみ
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload
```

### フロントエンドのみ
```bash
cd frontend
npm start
```

## 🛑 停止方法

- **自動起動スクリプト使用時**: `Ctrl+C`
- **手動起動時**: 各ターミナルで `Ctrl+C`

## ❓ 困ったときは

詳細な手順は [SETUP_GUIDE.md](./SETUP_GUIDE.md) を参照してください。