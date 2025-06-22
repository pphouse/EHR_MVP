# Claude Code 開発指示書

## プロジェクト初期設定

### 1. プロジェクト構造の作成

```bash
# Claude Codeへの指示
「Python FastAPIを使用した電子カルテシステムのプロジェクト構造を作成してください。
以下の要件を満たすようにしてください：
- バックエンドはFastAPI、フロントエンドはReact
- PostgreSQLとRedisを使用
- Dockerによるコンテナ化
- テストフレームワークはpytest
```

### 2. 開発環境のセットアップ

```bash
# Claude Codeへの指示
「開発環境をセットアップするためのスクリプトを作成してください：
- Python 3.11の仮想環境
- 必要なパッケージのインストール（requirements.txt）
  - azure-identity
  - azure-storage-blob
  - azure-keyvault-secrets
  - fhir.resources
- Docker Composeの設定ファイル
- 環境変数の設定（.env.example）
- Azure CLI認証設定
```

## バックエンド開発指示

### Phase 1: 基盤構築

#### 1.1 認証システムの実装

```bash
# Claude Codeへの指示
「FastAPIでJWT認証システムを実装してください：
- ユーザー登録エンドポイント（/api/v1/auth/register）
- ログインエンドポイント（/api/v1/auth/login）
- トークンリフレッシュエンドポイント（/api/v1/auth/refresh）
- パスワードハッシュ化（bcrypt使用）
- ロールベースのアクセス制御（医師、看護師、受付）
- SQLAlchemyを使用したUserモデル
```

#### 1.2 データベース設計

```bash
# Claude Codeへの指示
「電子カルテシステムのデータベーススキーマを設計してください：
- 患者テーブル（patients）: ID、氏名、生年月日、性別、住所、保険情報
- 医療従事者テーブル（practitioners）: ID、氏名、資格、診療科
- 診療記録テーブル（encounters）: ID、患者ID、医師ID、診療日時、主訴、診断
- 処方テーブル（prescriptions）: ID、診療ID、薬剤名、用法用量
- Alembicマイグレーションファイルも作成
- 適切なインデックスとリレーションを設定
```

#### 1.3 基本的なCRUD API

```bash
# Claude Codeへの指示
「患者管理のCRUD APIを実装してください：
- GET /api/v1/patients - 患者一覧取得（ページネーション付き）
- GET /api/v1/patients/{id} - 患者詳細取得
- POST /api/v1/patients - 患者登録
- PUT /api/v1/patients/{id} - 患者情報更新
- DELETE /api/v1/patients/{id} - 患者情報削除（論理削除）
- 入力検証はPydanticで実装
- エラーハンドリングを適切に実装
```

### Phase 2: コア機能実装

#### 2.1 診療記録機能

```bash
# Claude Codeへの指示
「診療記録管理機能を実装してください：
- SOAP形式での診療記録作成API
  - S: 主観的情報（主訴、症状）
  - O: 客観的情報（検査結果、バイタル）
  - A: 評価（診断）
  - P: 計画（治療方針、処方）
- 診療履歴の検索機能（患者ID、日付範囲、診断名）
- バイタルサイン記録（体温、血圧、脈拍、SpO2）
- ファイル添付機能（検査画像、書類）
```

#### 2.2 Azure API for FHIR 統合

```bash
# Claude Codeへの指示
「Azure API for FHIR との統合を実装してください：
- Azure Active Directory (AAD) 認証の設定
- FHIR クライアントの初期化
- Patient リソースの CRUD 操作
  - 作成: POST https://<your-fhir-server>.azurehealthcareapis.com/Patient
  - 取得: GET https://<your-fhir-server>.azurehealthcareapis.com/Patient/{id}
- Encounter リソースの管理
- Observation リソースの管理
- エラーハンドリングとリトライ機構
- FHIR バンドル操作のサポート
```

# MCP Text Analytics for Health 統合

```bash
# Claude Codeへの指示
「Text Analytics for Health API を統合してください：
- Azure Cognitive Services のセットアップ
- 診療記録テキストの医療エンティティ抽出
  - 症状 (Symptom)
  - 診断 (Diagnosis)
  - 薬剤 (Medication)
  - 処置 (Treatment)
- UMLS 概念へのリンク
- 否定・仮定表現の検出
- 日本語対応の確認と設定
- 抽出結果の FHIR リソースへの変換
```

#### 2.3 処方管理機能

```bash
# Claude Codeへの指示
「処方箋管理機能を実装してください：
- 薬剤マスタの実装（一般名、商品名、薬価）
- 処方箋作成API（用法用量の自動チェック）
- 薬剤相互作用チェック機能
- 処方履歴の管理
- お薬手帳データのエクスポート機能
```

### Phase 3: MCP AI機能実装

#### 3.1 Azure OpenAI Service 統合

```bash
# Claude Codeへの指示
「Azure OpenAI Service を使った医療AI機能を実装してください：
- Azure OpenAI のデプロイメント設定
- 診療記録要約生成エンドポイント
  - システムプロンプト: 医療専門用語を保持した要約
  - 患者情報のマスキング処理
- 退院サマリードラフト生成
  - FHIR Composition リソースとして保存
- 診断支援機能
  - 症状から可能性のある診断を提示
  - ICD-10 コードの提案
- Azure Content Safety によるコンテンツフィルタリング
```

#### 3.2 Azure Health Bot 統合

```bash
# Claude Codeへの指示
「Azure Health Bot との連携機能を実装してください：
- Health Bot のプロビジョニング設定
- FHIR データソースとの接続
- カスタムシナリオの作成
  - 症状チェッカー
  - 服薬リマインダー
  - 予約管理
- Web チャットコントロールの統合
- 多言語対応（日本語優先）
- 会話履歴の FHIR AuditEvent への記録
```

#### 3.3 医療データ分析機能

```bash
# Claude Codeへの指示
「Azure Synapse Analytics を使った医療データ分析機能を実装してください：
- FHIR データの定期的なエクスポート
- データレイクへの保存
- 患者統計ダッシュボード
  - 疾患別統計
  - 処方薬分析
  - 再診率分析
- Power BI 統合によるビジュアライゼーション
- DICOM 画像データの管理（Azure Medical Imaging）
```

## フロントエンド開発指示

### 基本UI実装

```bash
# Claude Codeへの指示
「Reactで電子カルテのダッシュボード画面を実装してください：
- Material-UIを使用したレスポンシブデザイン
- 患者検索機能（氏名、ID、カナ検索）
- 本日の予約一覧表示
- 最近の診療履歴表示
- 通知機能（検査結果到着など）
- ダークモード対応
```

### 診療記録入力画面

```bash
# Claude Codeへの指示
「診療記録入力画面を実装してください：
- SOAP形式の入力フォーム
- リアルタイム保存機能
- 音声入力ボタン（Web Speech API使用）
- テンプレート選択機能
- 過去記録の参照パネル
- 処方オーダー画面への遷移
```

## インフラ・デプロイ指示

### Docker化

```bash
# Claude Codeへの指示
「マルチステージビルドのDockerfileを作成してください：
- バックエンド用Dockerfile（Python 3.11-slim）
- フロントエンド用Dockerfile（Node.js 18）
- docker-compose.ymlで全サービスを定義
- ヘルスチェックの設定
- ボリュームマウントの最適化
```

### Azure デプロイ設定

```bash
# Claude Codeへの指示
「Azure へのデプロイ設定を作成してください：
- Terraform で Azure インフラをコード化
  - リソースグループ
  - App Service Plan (Linux)
  - Web App for Containers
  - Azure Database for PostgreSQL
  - Azure Cache for Redis
  - Azure API for FHIR
  - Application Gateway (WAF 有効)
- Azure Key Vault の設定
  - API キーの安全な管理
  - 接続文字列の保護
- Azure Monitor の設定
  - Application Insights
  - Log Analytics
  - アラート設定
- Azure Backup の設定
- Azure Security Center の有効化
```

### Azure DevOps パイプライン

```bash
# Claude Codeへの指示
「Azure DevOps CI/CD パイプラインを構築してください：
- ビルドパイプライン
  - コードのチェックアウト
  - 依存関係のインストール
  - ユニットテストの実行
  - Docker イメージのビルド
  - Azure Container Registry へのプッシュ
- リリースパイプライン
  - ステージング環境へのデプロイ
  - 統合テストの実行
  - 本番環境へのデプロイ（承認ゲート付き）
- セキュリティスキャン
  - SAST (Static Application Security Testing)
  - 依存関係の脆弱性チェック
```

## テスト実装指示

### ユニットテスト

```bash
# Claude Codeへの指示
「包括的なユニットテストを作成してください：
- 認証機能のテスト（正常系・異常系）
- CRUD操作のテスト
- FHIR変換のテスト
- バリデーションのテスト
- モックを使用した外部API呼び出しのテスト
- カバレッジ80%以上を目標
```

### 統合テスト

```bash
# Claude Codeへの指示
「E2Eテストを実装してください：
- Cypressを使用したフロントエンドテスト
- 患者登録から診療記録作成までのフロー
- 処方箋発行フロー
- API統合テスト（pytest使用）
- 負荷テスト（Locust使用）
```

## セキュリティ実装指示

```bash
# Claude Codeへの指示
「セキュリティ機能を実装してください：
- SQLインジェクション対策
- XSS対策（Content Security Policy）
- CSRF対策
- レート制限（Redis使用）
- 監査ログの実装
- データ暗号化（保存時・通信時）
- セッション管理の強化
```

## パフォーマンス最適化指示

```bash
# Claude Codeへの指示
「パフォーマンス最適化を実施してください：
- データベースクエリの最適化（N+1問題の解決）
- Redisキャッシングの実装
- 非同期処理の活用（Celery使用）
- フロントエンドのコード分割
- 画像の遅延読み込み
- API応答の圧縮
```

## ドキュメント作成指示

```bash
# Claude Codeへの指示
「プロジェクトドキュメントを作成してください：
- README.mdの作成（セットアップ手順含む）
- API仕様書（OpenAPI/Swagger）
- データベース設計書
- システムアーキテクチャ図（Mermaid使用）
- 開発者向けガイド
- ユーザーマニュアル
```

## MCP 特有の実装指示

### SMART on FHIR 認証

```bash
# Claude Codeへの指示
「SMART on FHIR 認証を実装してください：
- Azure AD B2C の設定
- OAuth 2.0 フローの実装
- FHIR リソースへのスコープベースアクセス
- EHR 起動とスタンドアロン起動の両方をサポート
- リフレッシュトークンの管理
```

### FHIR データ交換

```bash
# Claude Codeへの指示
「FHIR 相互運用性機能を実装してください：
- $everything オペレーションの実装
- Bulk Data Export の設定
- HL7 v2 メッセージから FHIR への変換
- CDA ドキュメントの FHIR 変換
- 他医療機関との連携設定
```

### コンプライアンスとセキュリティ

```bash
# Claude Codeへの指示
「医療規制に準拠したセキュリティを実装してください：
- Azure Policy によるコンプライアンス管理
- 保存データの暗号化（Azure Disk Encryption）
- 通信の暗号化（TLS 1.2以上）
- 監査ログの完全性（Azure Immutable Storage）
- RBAC による細かいアクセス制御
- 患者同意管理機能
```

## トラブルシューティング用指示

```bash
# Claude Codeへの指示例
「以下のエラーを解決してください：[エラー内容をペースト]」
「このコードのパフォーマンスを改善してください：[コードをペースト]」
「この機能にテストを追加してください：[機能の説明]」
「セキュリティの観点からこのコードをレビューしてください：[コードをペースト]」
```

## 注意事項

1. **段階的実装**: 一度に全機能を実装せず、MVPから始める
2. **コードレビュー**: Claude Codeが生成したコードは必ずレビューする
3. **テスト駆動**: テストを書いてから実装する
4. **ドキュメント**: コードと同時にドキュメントも更新する
5. **セキュリティ**: 医療情報を扱うため、セキュリティを最優先に

この指示書に従って、Claude Codeと対話しながら開発を進めてください。