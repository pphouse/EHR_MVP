# EHR MVP - Electronic Health Records Minimum Viable Product

OpenEMRを参考にした現代的な電子カルテシステムのMVP実装です。

## 🏗️ アーキテクチャ

- **バックエンド**: FastAPI (Python 3.11)
- **フロントエンド**: React 18 + Material-UI
- **データベース**: PostgreSQL 15
- **キャッシュ**: Redis 7
- **コンテナ**: Docker + Docker Compose

## 🚀 機能

### 認証・認可
- JWT認証
- ロールベースアクセス制御 (RBAC)
- ユーザー管理 (医師、看護師、受付など)

### 患者管理
- 患者基本情報管理
- 患者検索 (氏名、カナ、患者ID)
- 保険情報管理
- 緊急連絡先管理

### 診療記録
- SOAP形式の診療記録
- バイタルサイン記録
- 診療履歴管理
- BMI自動計算

### セキュリティ
- パスワードハッシュ化 (bcrypt)
- 入力検証 (Pydantic)
- SQLインジェクション対策
- CORS設定

## 📦 セットアップ

### 前提条件
- Docker & Docker Compose
- Git

### 開発環境の起動

1. プロジェクトのクローン
```bash
git clone <repository-url>
cd ehr-mvp
```

2. 環境変数の設定
```bash
cp .env.example .env
# .envファイルを編集して適切な値を設定
```

3. Docker Composeで起動
```bash
docker-compose up -d
```

4. データベースマイグレーション
```bash
docker-compose exec backend alembic upgrade head
```

### 個別サービスの起動

#### バックエンドのみ (開発用)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### フロントエンドのみ (開発用)
```bash
cd frontend
npm install
npm start
```

## 📚 API ドキュメント

サーバー起動後、以下のURLでSwagger UIにアクセス可能:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

## 🔗 エンドポイント

### 認証
- `POST /api/v1/auth/register` - ユーザー登録
- `POST /api/v1/auth/login` - ログイン
- `GET /api/v1/auth/me` - 現在のユーザー情報

### 患者管理
- `GET /api/v1/patients` - 患者検索・一覧
- `POST /api/v1/patients` - 患者登録
- `GET /api/v1/patients/{id}` - 患者詳細
- `PUT /api/v1/patients/{id}` - 患者情報更新
- `DELETE /api/v1/patients/{id}` - 患者削除 (論理削除)

### 診療記録
- `GET /api/v1/encounters` - 診療記録検索・一覧
- `POST /api/v1/encounters` - 診療記録作成
- `GET /api/v1/encounters/{id}` - 診療記録詳細
- `PUT /api/v1/encounters/{id}` - 診療記録更新
- `PATCH /api/v1/encounters/{id}/vital-signs` - バイタルサイン更新
- `PATCH /api/v1/encounters/{id}/soap-notes` - SOAP記録更新

## 🧪 テスト

```bash
# バックエンドのテスト
cd backend
pytest

# フロントエンドのテスト
cd frontend
npm test
```

## 📂 プロジェクト構造

```
ehr-mvp/
├── backend/                 # FastAPI バックエンド
│   ├── app/
│   │   ├── api/            # API エンドポイント
│   │   ├── core/           # 設定、データベース、セキュリティ
│   │   ├── models/         # SQLAlchemy モデル
│   │   ├── schemas/        # Pydantic スキーマ
│   │   ├── services/       # ビジネスロジック
│   │   └── main.py         # アプリケーションエントリーポイント
│   ├── tests/              # テスト
│   ├── migrations/         # Alembic マイグレーション
│   └── requirements.txt    # Python 依存関係
├── frontend/               # React フロントエンド
│   ├── src/
│   │   ├── components/     # React コンポーネント
│   │   ├── pages/          # ページコンポーネント
│   │   ├── services/       # API サービス
│   │   └── utils/          # ユーティリティ
│   └── package.json        # Node.js 依存関係
├── docker/                 # Docker 設定
├── scripts/                # スクリプト
└── docs/                   # ドキュメント
```

## 🔧 開発

### コードスタイル
- Python: Black + isort + flake8
- JavaScript: ESLint + Prettier

### コミット規約
Conventional Commitsを使用:
```
feat: 新機能
fix: バグ修正
docs: ドキュメント
style: コードスタイル
refactor: リファクタリング
test: テスト
chore: その他
```

## 🔐 セキュリティ

- 全ての機密情報は環境変数で管理
- データベース接続は暗号化
- パスワードはbcryptでハッシュ化
- JWT トークンによる認証
- ロールベースのアクセス制御

## 📈 今後の拡張予定

- Azure FHIR API 統合
- Azure OpenAI 統合 (診療記録要約)
- 予約管理機能
- 処方箋管理
- レポート機能
- モバイルアプリ対応

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 サポート

問題や質問がある場合は、GitHubのIssuesを使用してください。