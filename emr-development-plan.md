# Python FHIR対応電子カルテシステム開発計画書

## プロジェクト概要

### システム名称
**PyClinic EMR** - Python-based Clinical Electronic Medical Record System

### 対象環境
- **診療科**: 内科・総合診療を基本とし、他科にも拡張可能
- **規模**: 医師1-3名、スタッフ2-5名、1日患者数20-50名程度
- **特徴**: シンプルで使いやすく、日本の診療に最適化

### 技術スタック
- **バックエンド**: Python 3.11+ (FastAPI)
- **フロントエンド**: React 18 + TypeScript
- **データベース**: Azure Database for PostgreSQL + Azure Cache for Redis
- **FHIR**: Azure API for FHIR / Azure Health Data Services
- **クラウド**: Microsoft Azure (MCPとの統合を重視)
- **AI/ML**: Azure OpenAI Service + Azure Cognitive Services + Text Analytics for Health

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                     フロントエンド層                          │
│  React + TypeScript + Material-UI + TanStack Query          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Azure API Management                       │
│                    (APIゲートウェイ)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   アプリケーション層                          │
│     FastAPI + Pydantic + SQLAlchemy + Celery               │
├─────────────────────────┬───────────────────────────────────┤
│    ビジネスロジック      │      MCP AI サービス層             │
│  ・患者管理              │  ・Text Analytics for Health      │
│  ・診療記録              │  ・Azure OpenAI Service          │
│  ・処方管理              │  ・Azure Health Bot              │
└─────────────────────────┴───────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     データ層                                 │
│ Azure Database │ Azure Cache │ Blob Storage │ Azure API    │
│ for PostgreSQL │ for Redis   │              │ for FHIR     │
└─────────────────────────────────────────────────────────────┘
```

## モジュール構成

### 1. コアモジュール

#### 1.1 認証・認可モジュール (`auth/`)
- JWT認証
- ロールベースアクセス制御 (RBAC)
- セッション管理

#### 1.2 患者管理モジュール (`patients/`)
- 患者基本情報管理
- 保険情報管理
- 家族歴・既往歴管理

#### 1.3 診療記録モジュール (`encounters/`)
- SOAP形式での記録
- 診療予約管理
- 検査結果管理

#### 1.4 処方・投薬モジュール (`medications/`)
- 処方箋作成
- 薬剤相互作用チェック
- 服薬指導記録

### 2. FHIR統合モジュール (`fhir/`)

```python
# FHIR リソースマッピング
RESOURCE_MAPPING = {
    'Patient': '患者基本情報',
    'Practitioner': '医療従事者情報',
    'Encounter': '診療イベント',
    'Observation': '検査結果・バイタル',
    'Condition': '診断名・病名',
    'MedicationRequest': '処方箋',
    'ServiceRequest': '検査オーダー',
    'DiagnosticReport': '検査報告書',
    'DocumentReference': '文書参照',
    'Composition': '退院サマリー等の構造化文書'
}
```

### 3. AI統合モジュール (`ai/`)

#### 3.1 Text Analytics for Health 統合
- 医療テキストからの情報抽出
- 症状・診断・薬剤の自動認識
- UMLS概念へのマッピング
- 否定表現の検出

#### 3.2 Azure OpenAI Service 統合
- 診療記録の要約生成
- 退院サマリーのドラフト作成
- 医療クエリへの応答生成
- プロンプトエンジニアリング

#### 3.3 Azure Health Bot 連携
- 患者向けチャットボット
- 症状チェッカー
- 予約システム統合
- FHIR データへの自然言語アクセス

### 4. レポーティングモジュール (`reports/`)
- 紹介状作成
- 診断書作成
- 統計レポート生成

## 開発フェーズ

### Phase 1: 基盤構築（1-2ヶ月）
1. 開発環境構築
2. 認証・認可システム実装
3. 基本的なCRUD API構築
4. データベース設計とマイグレーション

### Phase 2: コア機能実装（2-3ヶ月）
1. 患者管理機能
2. 診療記録機能
3. 基本的なUIの実装
4. FHIR基本リソースの統合

### Phase 3: 高度機能実装（2-3ヶ月）
1. AI機能の統合
2. 高度な検索機能
3. レポート生成機能
4. 外部システム連携

### Phase 4: テスト・最適化（1-2ヶ月）
1. 統合テスト
2. パフォーマンス最適化
3. セキュリティ監査
4. ユーザビリティテスト

## セキュリティ要件

### データ保護
- 保存時暗号化 (AES-256)
- 通信時暗号化 (TLS 1.3)
- データベース暗号化

### アクセス制御
- 多要素認証 (MFA)
- IPアドレス制限
- 監査ログ

### コンプライアンス
- 個人情報保護法準拠
- 医療情報の安全管理ガイドライン準拠
- 3省2ガイドライン準拠

## プロジェクト構造

```
pyclinic-emr/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── patients.py
│   │   │   │   ├── encounters.py
│   │   │   │   └── medications.py
│   │   │   └── v2/
│   │   ├── models/
│   │   │   ├── patient.py
│   │   │   ├── encounter.py
│   │   │   └── medication.py
│   │   ├── schemas/
│   │   │   ├── patient.py
│   │   │   ├── encounter.py
│   │   │   └── medication.py
│   │   ├── services/
│   │   │   ├── fhir_service.py
│   │   │   ├── ai_service.py
│   │   │   └── report_service.py
│   │   └── utils/
│   ├── tests/
│   ├── alembic/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── Dockerfile
├── infrastructure/
│   ├── terraform/
│   ├── kubernetes/
│   └── docker-compose.yml
└── docs/
    ├── api/
    ├── user-guide/
    └── development/
```

## 技術的な実装詳細

### FastAPIを選択した理由
1. **高速性**: 非同期処理により高いパフォーマンス
2. **型安全性**: Pydanticによる自動バリデーション
3. **自動ドキュメント**: OpenAPI準拠のAPI文書自動生成
4. **開発効率**: 少ないコードで高機能なAPIを実装

### データベース設計の方針
- 正規化を基本としつつ、パフォーマンスを考慮した非正規化
- JSONBフィールドを活用した柔軟なデータ構造
- インデックスの適切な設計

### AI統合の実装方針
- APIベースの疎結合な設計
- プロンプトエンジニアリングによる精度向上
- フォールバック機構の実装

## 推定開発コスト

### 人員構成
- プロジェクトマネージャー: 1名
- バックエンド開発者: 2名
- フロントエンド開発者: 2名
- AI/MLエンジニア: 1名
- QAエンジニア: 1名

### 期間
- 総開発期間: 8-10ヶ月
- MVP完成: 4-5ヶ月

### インフラコスト（月額）
- Azure: 約15-25万円（初期は最小構成）
  - Azure API for FHIR: 約5-10万円
  - Azure OpenAI Service: 約5-10万円
  - その他（DB、Storage、Compute）: 約5万円
- Azure Active Directory: 基本機能は無料
- 監視・バックアップ: 約2-3万円

## リスクと対策

### 技術的リスク
- **FHIR標準の複雑性**: 段階的な実装とコミュニティの活用
- **AI精度の問題**: 継続的な学習とフィードバックループ
- **パフォーマンス**: キャッシング戦略とDB最適化

### ビジネスリスク
- **規制変更**: 柔軟な設計と定期的な法令チェック
- **セキュリティ**: 定期的な監査と脆弱性診断
- **ユーザー受容性**: プロトタイプによる早期検証

## 成功指標 (KPI)

### 技術指標
- API応答時間: 95%tile < 200ms
- システム稼働率: 99.9%以上
- エラー率: 0.1%以下

### ビジネス指標
- 診療記録入力時間: 50%削減
- 患者待ち時間: 30%削減
- ユーザー満足度: 4.0/5.0以上

## 次のステップ

1. 要件の詳細化とプロトタイプ作成
2. 技術選定の最終確認
3. 開発チームの編成
4. 開発環境の構築
5. MVP開発の開始