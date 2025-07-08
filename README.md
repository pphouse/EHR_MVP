# EHR MVP - Electronic Health Records Minimum Viable Product

OpenEMRを参考にした現代的な電子カルテシステムのMVP実装です。

## 🏗️ アーキテクチャ

- **バックエンド**: FastAPI (Python 3.11)
- **フロントエンド**: React 18 + Material-UI
- **データベース**: PostgreSQL 15 / SQLite (開発環境)
- **キャッシュ**: Redis 7
- **AI/ML**: Azure OpenAI Service
- **コンテナ**: Docker + Docker Compose
- **E2Eテスト**: Playwright

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
- 患者詳細情報の統合表示

### 診療記録
- SOAP形式の診療記録
- バイタルサイン記録
- 診療履歴管理
- BMI自動計算
- エンカウンターIDの堅牢な生成

### 処方箋管理
- 処方箋の作成・編集・削除
- 医薬品マスタ管理
- 投薬指示の記録
- 処方履歴の参照

### AIアシスタント機能
- Azure OpenAI統合による診療記録要約
- リアルタイム臨床サマリー生成
- 臨床判断支援
- 自然言語処理による医療情報抽出

### FHIR連携
- FHIR形式へのデータ変換
- 患者情報のFHIR準拠エクスポート
- 診療記録のFHIR形式での保存

### プライバシー保護
- 強化されたPII（個人識別情報）検出
- 自動的な個人情報のマスキング
- プライバシー保護レベルの設定

### 監査・コンプライアンス
- 全操作の監査ログ記録
- アクセスログの可視化
- コンプライアンスレポート生成
- ロールベースの監査ログアクセス

### セキュリティ
- パスワードハッシュ化 (bcrypt)
- 入力検証 (Pydantic)
- SQLインジェクション対策
- CORS設定
- Azure Key Vaultによる機密情報管理

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

### 処方箋管理
- `GET /api/v1/prescriptions` - 処方箋一覧
- `POST /api/v1/prescriptions` - 処方箋作成
- `GET /api/v1/prescriptions/{id}` - 処方箋詳細
- `PUT /api/v1/prescriptions/{id}` - 処方箋更新
- `DELETE /api/v1/prescriptions/{id}` - 処方箋削除

### 医薬品管理
- `GET /api/v1/medications` - 医薬品一覧
- `POST /api/v1/medications` - 医薬品登録
- `PUT /api/v1/medications/{id}` - 医薬品情報更新

### AIアシスタント
- `POST /api/v1/clinical-assistant/analyze` - 診療記録の分析
- `POST /api/v1/clinical-assistant/summarize` - 診療サマリー生成
- `POST /api/v1/clinical-assistant/check-pii` - PII検出

### FHIR変換
- `POST /api/v1/fhir/convert/patient` - 患者情報のFHIR変換
- `POST /api/v1/fhir/convert/encounter` - 診療記録のFHIR変換
- `GET /api/v1/fhir/export` - FHIRデータエクスポート

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
│   │   │   └── v1/         # APIバージョン1
│   │   │       ├── enhanced_clinical_assistant.py
│   │   │       ├── fhir.py
│   │   │       └── fhir_converter.py
│   │   ├── core/           # 設定、データベース、セキュリティ
│   │   ├── models/         # SQLAlchemy モデル
│   │   ├── schemas/        # Pydantic スキーマ
│   │   ├── services/       # ビジネスロジック
│   │   │   ├── clinical_assistant_service.py
│   │   │   ├── enhanced_pii_service.py
│   │   │   └── fhir_converter_service.py
│   │   └── main.py         # アプリケーションエントリーポイント
│   ├── tests/              # テスト
│   ├── migrations/         # Alembic マイグレーション
│   └── requirements.txt    # Python 依存関係
├── frontend/               # React フロントエンド
│   ├── src/
│   │   ├── components/     # React コンポーネント
│   │   │   ├── AuditLogViewer.js
│   │   │   ├── ClinicalValidationChecker.js
│   │   │   ├── EnhancedPIIChecker.js
│   │   │   ├── NotificationSettings.js
│   │   │   ├── PatientDetail.js
│   │   │   └── RealTimeClinicalSummary.js
│   │   ├── pages/          # ページコンポーネント
│   │   │   ├── AuditDashboard.js
│   │   │   ├── PatientCreate.js
│   │   │   ├── PrescriptionCreate.js
│   │   │   └── Prescriptions.js
│   │   ├── services/       # API サービス
│   │   │   └── enhancedClinicalAPI.js
│   │   └── utils/          # ユーティリティ
│   └── package.json        # Node.js 依存関係
├── e2e-tests/              # E2Eテスト (Playwright)
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

## 🏗️ アーキテクチャ詳細

### バックエンド構成
- **FastAPI**: 高速で型安全なWeb APIフレームワーク
- **SQLAlchemy**: ORMによるデータベース操作
- **Alembic**: データベースマイグレーション管理
- **Pydantic**: データバリデーションとシリアライゼーション
- **Azure OpenAI**: AIアシスタント機能の実装
- **FHIR**: 医療情報交換の標準規格準拠

### フロントエンド構成
- **React 18**: UIライブラリ
- **Material-UI**: UIコンポーネントライブラリ
- **React Router**: ルーティング管理
- **Axios**: HTTPクライアント
- **Context API**: 状態管理

## 🔧 環境変数設定

必要な環境変数を`.env`ファイルに設定:

```bash
# データベース
DATABASE_URL=postgresql://user:password@localhost:5432/ehr_mvp

# JWT設定
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Azure OpenAI
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name

# FHIR設定
FHIR_SERVER_URL=your-fhir-server-url
```

## 📈 今後の拡張予定

- リアルタイムコラボレーション機能
- 予約管理システムの統合
- 画像診断システムとの連携
- レポート・統計機能の強化
- モバイルアプリ対応
- 多言語対応
- 音声入力による診療記録作成

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