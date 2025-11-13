# アンサンブル診断システム - Ensemble Diagnosis System

## 概要

EHR_MVPの鑑別診断と治療提案機能は、複数の大規模言語モデル（LLM）を活用したアンサンブル診断システムを採用しています。このシステムは、3つの異なるAIモデルが独立して診断を行い、その結果を統合することで、より信頼性の高い医療判断支援を提供します。

## システムアーキテクチャ

### 使用するモデル

1. **Llama 3.1 8B** - 高速・軽量モデル（素早い初期診断）
2. **Llama 3.1 70B** - バランス型の高性能モデル
3. **Llama 3.3 70B** - 最新の70Bモデル（最先端の診断能力）

### 最終診断モデル

- **Llama 3.1 70B (Thinking)** - 3つのモデルの結果を統合し、最終診断を生成

### プロバイダー

すべてのモデルは、**Cerebras API**を通じて提供されます。Cerebrasは超高速推論を実現する専用ハードウェアを使用しており、リアルタイムな診断支援に最適です。

## 動作フロー

```
1. 患者データ入力（S&O、バイタル、既往歴など）
   ↓
2. 3つのLlamaモデルが並列で独立して診断を生成
   - Llama 3.1 8B → 診断結果A（高速・軽量）
   - Llama 3.1 70B → 診断結果B（バランス型）
   - Llama 3.3 70B → 診断結果C（最新・高性能）
   ↓
3. Llama 3.1 70Bが3つの結果を評価・統合
   - 共通している所見を抽出
   - 矛盾点を医学的根拠に基づいて判断
   - 各モデルの信頼度を考慮
   ↓
4. 最終診断を生成
   - 統合された鑑別診断リスト
   - 推奨される検査・治療
   - 信頼度スコアとコンセンサスレベル
```

## セットアップ

### 1. Cerebras APIキーの取得

1. [Cerebras Cloud](https://cloud.cerebras.ai/)にアクセス
2. アカウントを作成
3. APIキーを生成

### 2. 環境変数の設定

`.env`ファイルに以下を追加：

```bash
# Cerebras API (for Ensemble Diagnosis System)
CEREBRAS_API_KEY=your-cerebras-api-key

# Azure OpenAI (for fallback and PII detection)
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### 3. 依存関係のインストール

```bash
cd backend
pip install openai  # Cerebras APIはOpenAI互換
```

## API使用方法

### エンドポイント

```
POST /api/v1/enhanced-clinical/generate-patient-summary
```

### リクエスト例

```json
{
  "basic_info": {
    "age": 45,
    "gender": "男性",
    "medical_history": "高血圧、糖尿病"
  },
  "vitals": {
    "temperature": 38.5,
    "blood_pressure_systolic": 145,
    "blood_pressure_diastolic": 90,
    "heart_rate": 95,
    "respiratory_rate": 18,
    "oxygen_saturation": 96
  },
  "subjective": "3日前から発熱、咳、全身倦怠感を訴えている。食欲不振もあり。",
  "objective": "胸部聴診で右下肺野にcoarse cracklesを聴取。咽頭発赤あり。"
}
```

### レスポンス例

```json
{
  "status": "success",
  "patient_situation": {
    "summary": "45歳男性、発熱・咳・全身倦怠感を主訴に来院。右下肺野にcoarse cracklesを聴取し、市中肺炎の可能性が高い。",
    "key_findings": [
      "発熱38.5℃",
      "右下肺野にcoarse crackles",
      "咽頭発赤",
      "全身倦怠感"
    ],
    "differential_diagnoses": [
      {
        "diagnosis": "市中肺炎",
        "probability": 0.85,
        "supporting_evidence": [
          "発熱と咳の症状",
          "右下肺野のcoarse crackles",
          "全身倦怠感"
        ],
        "additional_tests": [
          "胸部X線検査",
          "血液検査（CRP、WBC）",
          "喀痰培養"
        ],
        "model_agreement": ["Qwen 3 235B", "Llama 3.3", "OpenAI GPT"]
      },
      {
        "diagnosis": "急性気管支炎",
        "probability": 0.10,
        "supporting_evidence": ["咳嗽", "発熱"],
        "additional_tests": ["胸部X線で肺炎除外"],
        "model_agreement": ["Llama 3.3"]
      }
    ],
    "risk_factors": [
      "糖尿病による免疫力低下",
      "高血圧による心血管系リスク"
    ],
    "recommendations": [
      "胸部X線検査を早急に実施",
      "血液検査でCRP、白血球数を確認",
      "抗菌薬治療の開始を検討",
      "水分補給と解熱剤の投与",
      "糖尿病のコントロール状況を確認"
    ],
    "confidence_score": 0.87,
    "generated_at": "2025-11-13T10:30:00"
  },
  "ensemble_info": {
    "is_ensemble": true,
    "consensus_level": 0.82,
    "synthesis_reasoning": "3つのモデルすべてが市中肺炎を最も可能性の高い診断として指摘。Llama 3.3は急性気管支炎も鑑別診断に挙げているが、physical findingsから肺炎の可能性が高いと判断。既往歴の糖尿病が重要なリスク因子として全モデルで一致。",
    "models_used": 3,
    "individual_results": [
      {
        "model_name": "qwen/qwen-2.5-72b-instruct",
        "summary": "市中肺炎を強く疑う。糖尿病があり重症化リスクに注意。",
        "confidence_score": 0.88,
        "reasoning": "発熱、咳、肺野異常所見から典型的な市中肺炎のプレゼンテーション..."
      },
      {
        "model_name": "meta-llama/llama-3.3-70b-instruct",
        "summary": "市中肺炎または急性気管支炎。胸部X線で鑑別が必要。",
        "confidence_score": 0.85,
        "reasoning": "症状と身体所見から呼吸器感染症は明らか。画像検査で確定診断を..."
      },
      {
        "model_name": "openai-community/gpt2-xl",
        "summary": "市中肺炎の可能性が高い。早期治療介入が重要。",
        "confidence_score": 0.88,
        "reasoning": "臨床症状とphysical examから市中肺炎を第一に考える..."
      }
    ]
  },
  "usage_note": "この要約は医学的判断の補助として提供されています。最終的な診断・治療方針は医師の判断に基づいてください。 この診断は3つの異なるAIモデルの結果を統合したアンサンブル診断です。"
}
```

## レスポンスフィールド説明

### 基本情報

- `patient_situation`: 統合された最終診断結果
  - `summary`: 患者状況の簡潔な要約
  - `key_findings`: 重要な所見リスト
  - `differential_diagnoses`: 鑑別診断リスト（確率順）
  - `risk_factors`: 特定されたリスク要因
  - `recommendations`: 推奨される次のステップ
  - `confidence_score`: 最終診断の信頼度スコア (0.0-1.0)

### アンサンブル情報

- `ensemble_info`: アンサンブル診断の詳細情報
  - `is_ensemble`: アンサンブル診断が使用されたかどうか
  - `consensus_level`: モデル間の合意度 (0.0-1.0)
    - 0.8以上: 高い合意
    - 0.6-0.8: 中程度の合意
    - 0.6未満: 低い合意（要注意）
  - `synthesis_reasoning`: 統合プロセスの説明
  - `models_used`: 使用されたモデルの数
  - `individual_results`: 各モデルの個別結果

## フォールバック機構

Cerebras APIが利用できない場合、システムは自動的にAzure OpenAIにフォールバックします：

1. Cerebras APIエラー検出
2. Azure OpenAI APIで単一モデル診断を実行
3. 結果を返す（`is_ensemble: false`）

この機構により、高い可用性を確保しています。

## 信頼度とコンセンサスの解釈

### 信頼度スコア (confidence_score)

- **0.9以上**: 非常に高い信頼度
- **0.7-0.9**: 高い信頼度
- **0.5-0.7**: 中程度の信頼度
- **0.5未満**: 低い信頼度（要追加検査）

### コンセンサスレベル (consensus_level)

- **0.8以上**: モデル間で高度な一致
- **0.6-0.8**: 一定の合意あり
- **0.6未満**: 意見が分かれている（慎重な判断が必要）

## ベストプラクティス

### 1. 結果の解釈

- 複数のモデルで一致している診断は信頼性が高い
- コンセンサスレベルが低い場合は、個別モデルの結果も確認する
- `synthesis_reasoning`を読んで統合プロセスを理解する

### 2. エラーハンドリング

- APIエラー時のフォールバック結果も有用
- 信頼度が低い場合は手動での詳細評価を推奨
- タイムアウトに備えて適切なタイムアウト設定を行う

### 3. セキュリティ

- APIキーは環境変数で管理し、コードにハードコードしない
- PII（個人識別情報）は自動的にマスキングされる
- ログには患者の機密情報を含めない

## パフォーマンス

- **平均レスポンス時間**: 2-5秒
  - 3つのモデルは並列実行
  - Cerebrasの超高速推論により実現
- **スループット**: 高負荷時でも安定したパフォーマンス
- **可用性**: フォールバック機構により99%以上

## トラブルシューティング

### Cerebras APIエラー

```python
# ログを確認
tail -f backend/logs/application.log | grep -i cerebras
```

**よくあるエラー：**

1. **APIキーが無効**
   - 解決: `.env`ファイルのAPIキーを確認

2. **レート制限**
   - 解決: リクエスト頻度を調整

3. **モデル名が間違っている**
   - 解決: `cerebras_service.py`のモデル名を確認

### Azure OpenAIフォールバックエラー

**症状**: Cerebrasとフォールバックの両方が失敗

**解決**:
1. Azure OpenAI APIキーと設定を確認
2. ネットワーク接続を確認
3. サービスの状態を確認

## 開発情報

### ファイル構成

```
backend/
├── app/
│   ├── services/
│   │   ├── cerebras_service.py          # Cerebras API統合
│   │   └── clinical_assistant_service.py # アンサンブル診断ロジック
│   └── api/
│       └── v1/
│           └── enhanced_clinical_assistant.py # APIエンドポイント
```

### カスタマイズ

モデルの変更や追加は`cerebras_service.py`で行います：

```python
class CerebrasService:
    # モデル定義 (2025年版)
    LLAMA_31_8B = "llama3.1-8b"           # 高速・軽量モデル
    LLAMA_31_70B = "llama3.1-70b"         # バランス型モデル
    LLAMA_33_70B = "llama-3.3-70b"        # 最新の70Bモデル
    THINKING_MODEL = "llama3.1-70b"       # 最終診断統合用

    # 新しいモデルを追加する場合（Cerebrasのドキュメントで確認）
    # NEW_MODEL = "model-name"
```

## 今後の改善予定

- [ ] より多くのモデルの追加（5-7モデル）
- [ ] 専門分野別のモデル選択
- [ ] リアルタイムフィードバック機能
- [ ] 診断精度のトラッキングとA/Bテスト
- [ ] ユーザーによる診断評価機能

## 参考資料

- [Cerebras Cloud Documentation](https://docs.cerebras.net/)
- [Azure OpenAI Service Documentation](https://learn.microsoft.com/azure/ai-services/openai/)
- [アンサンブル学習の理論](https://en.wikipedia.org/wiki/Ensemble_learning)

## サポート

問題が発生した場合は、以下のログファイルを確認してください：

```bash
backend/logs/application.log
```

または、GitHubでイシューを作成してください。

---

**注意事項**: このシステムは医療判断の補助ツールです。最終的な診断と治療方針は、必ず医師の専門的判断に基づいて決定してください。
