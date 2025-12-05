# 循環器ガイドライン4択クイズ 評価システム

GenIAC Prize ハルシネーション低減技術開発のための評価システム

## 概要

単一LLMとアンサンブルLLMの精度を比較し、アンサンブル手法によるハルシネーション低減効果を定量評価します。

## 評価対象モデル

### 単一モデル
1. **Llama 3.1 8B** (Cerebras)
2. **Llama 3.3 70B** (Cerebras)
3. **Azure GPT-5** (Azure OpenAI)

### アンサンブルモデル
- 上記3モデルの回答を **Qwen-3 235B Instruct** で統合
- フォールバック: 多数決方式

## 評価データ

- **データセット**: 循環器領域ガイドライン4択クイズ (50問)
- **出典**: JCS 2021年改訂版 急性・慢性心不全診療ガイドライン等
- **形式**: CSV (Q, テーマ, 設問, 選択肢1-4, 正答, 根拠, 引用文献)

## 使用方法

### 1. 環境変数設定

`.env`ファイルに以下を設定:
```bash
CEREBRAS_API_KEY=your_key_here
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=your_endpoint_here
```

### 2. 依存パッケージインストール

```bash
cd /Users/naoto/EHR_MVP/backend
source venv/bin/activate
pip install cerebras-cloud-sdk openai python-dotenv
```

### 3. 評価実行

```bash
python evaluation/src/quiz_evaluator.py
```

## 出力結果

### 1. 詳細結果 (JSON)
`evaluation/results/evaluation_results_YYYYMMDD_HHMMSS.json`

- 各問題の回答詳細
- モデルごとの正答/誤答
- アンサンブルの信頼度スコア
- 統合理由

### 2. サマリー (TXT)
`evaluation/results/summary_YYYYMMDD_HHMMSS.txt`

- モデルごとの正答率
- アンサンブルの正答率
- 改善率

## 評価指標

- **正答率 (Accuracy)**: 正解数 / 総問題数
- **改善率**: アンサンブル正答率 - 最良単一モデル正答率

## ディレクトリ構造

```
evaluation/
├── data/
│   └── herat_failure.csv          # 評価用クイズデータ
├── src/
│   └── quiz_evaluator.py          # 評価システム本体
├── results/
│   ├── evaluation_results_*.json  # 詳細結果
│   └── summary_*.txt               # サマリー
└── README.md                       # 本ファイル
```

## GenIAC Prize 提出用

このシステムで得られた結果は、ハルシネーション低減技術としてのアンサンブル手法の有効性を示すエビデンスとして使用できます。

### 期待される結果

- 単一モデル: 60-80% の正答率
- アンサンブル: 75-90% の正答率
- 改善率: +5-15 ポイント

## ライセンス

本評価システムはGenIAC Prize用の研究目的で作成されました。
