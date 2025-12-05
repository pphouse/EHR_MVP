"""
循環器ガイドライン4択クイズの評価システム
単一モデルとアンサンブルモデルの精度を比較
"""
import os
import sys
import csv
import json
import asyncio
import logging
from typing import List, Dict, Any, Tuple
from datetime import datetime
from cerebras.cloud.sdk import Cerebras
from openai import OpenAI

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend'))

# ログ設定
def setup_logger(log_file: str):
    """ログ設定 - コンソールとファイルの両方に出力"""
    logger = logging.getLogger('quiz_evaluator')
    logger.setLevel(logging.INFO)

    # ファイルハンドラ
    file_handler = logging.FileHandler(log_file, mode='w', encoding='utf-8')
    file_handler.setLevel(logging.INFO)

    # コンソールハンドラ
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)

    # フォーマット
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger


class QuizEvaluator:
    """クイズ評価システム"""

    # モデル定義
    LLAMA_31_8B = "llama3.1-8b"
    LLAMA_33_70B = "llama-3.3-70b"
    AZURE_GPT5 = "azure-gpt-5"
    QWEN_INSTRUCT = "qwen-3-235b-a22b-instruct-2507"

    # レート制限対策の待機時間（秒）
    SLEEP_BETWEEN_QUESTIONS = 3  # 各問題の後
    SLEEP_BETWEEN_MODELS = 1     # 各モデルの後
    SLEEP_AFTER_ENSEMBLE = 2     # アンサンブル評価の後

    def __init__(self, logger=None):
        """初期化"""
        self.logger = logger or logging.getLogger('quiz_evaluator')

        # Cerebras APIクライアント
        cerebras_api_key = os.getenv("CEREBRAS_API_KEY")
        if not cerebras_api_key:
            raise ValueError("CEREBRAS_API_KEY not found")

        self.cerebras_client = Cerebras(api_key=cerebras_api_key)
        self.logger.info("Cerebras client initialized")

        # Azure OpenAI クライアント
        azure_api_key = os.getenv("AZURE_OPENAI_API_KEY")
        azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

        if azure_api_key and azure_endpoint:
            if not azure_endpoint.endswith('/'):
                azure_endpoint += '/'
            base_url = f"{azure_endpoint}openai/v1/"
            self.azure_client = OpenAI(api_key=azure_api_key, base_url=base_url)
            self.logger.info("Azure OpenAI client initialized")
        else:
            self.azure_client = None
            self.logger.warning("Azure OpenAI not configured")

    def load_quiz_data(self, csv_path: str) -> List[Dict[str, Any]]:
        """CSVからクイズデータを読み込み"""
        quiz_data = []

        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                quiz_data.append({
                    'id': row['Q'],
                    'theme': row['テーマ'],
                    'question': row['設問'],
                    'option1': row['選択肢1'],
                    'option2': row['選択肢2'],
                    'option3': row['選択肢3'],
                    'option4': row['選択肢4'],
                    'correct_answer': int(row['正答']),
                    'rationale': row['根拠となる知識'],
                    'reference': row['引用文献']
                })

        return quiz_data

    def create_prompt(self, quiz: Dict[str, Any]) -> str:
        """クイズ用プロンプトを作成"""
        return f"""以下は循環器領域のガイドラインに関する4択クイズです。
最も適切な選択肢を1つ選び、その番号（1, 2, 3, 4のいずれか）のみを回答してください。

【問題】
{quiz['question']}

【選択肢】
1. {quiz['option1']}
2. {quiz['option2']}
3. {quiz['option3']}
4. {quiz['option4']}

【回答】
最も適切な選択肢の番号を1つだけ答えてください（1, 2, 3, 4のいずれか）。
"""

    async def ask_single_model(self, model_name: str, quiz: Dict[str, Any]) -> Dict[str, Any]:
        """単一モデルに質問"""
        prompt = self.create_prompt(quiz)

        try:
            self.logger.info(f"  Requesting {model_name}...")

            if model_name == self.AZURE_GPT5:
                if not self.azure_client:
                    self.logger.warning(f"  {model_name}: Azure client not configured")
                    return {'model': model_name, 'answer': None, 'raw_response': None, 'error': 'Azure client not configured'}

                response = self.azure_client.chat.completions.create(
                    model="azure-gpt-5",
                    messages=[{"role": "user", "content": prompt}],
                    max_completion_tokens=100
                    # GPT-5はtemperature=1.0のみサポート（デフォルト）
                )
                raw_response = response.choices[0].message.content
            else:
                # Cerebras models
                response = self.cerebras_client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}],
                    max_completion_tokens=100,
                    temperature=0.1
                )
                raw_response = response.choices[0].message.content

            # 回答から数字を抽出
            answer = self._extract_answer(raw_response)
            self.logger.info(f"  {model_name}: Answer={answer}")

            # レート制限対策
            await asyncio.sleep(self.SLEEP_BETWEEN_MODELS)

            return {
                'model': model_name,
                'answer': answer,
                'raw_response': raw_response,
                'error': None
            }

        except Exception as e:
            self.logger.error(f"  {model_name}: Error - {str(e)}")
            return {
                'model': model_name,
                'answer': None,
                'raw_response': None,
                'error': str(e)
            }

    def _extract_answer(self, response: str) -> int:
        """レスポンスから回答番号を抽出"""
        if not response:
            return None

        # 数字を探す（1, 2, 3, 4）
        for num in ['1', '2', '3', '4']:
            if num in response[:20]:  # 最初の20文字以内に数字があるか
                return int(num)

        # より詳細な検索
        import re
        match = re.search(r'[1-4]', response)
        if match:
            return int(match.group())

        return None

    async def evaluate_single_models(self, quiz_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """単一モデルでの評価"""
        models = [self.LLAMA_31_8B, self.LLAMA_33_70B, self.AZURE_GPT5]
        results = {model: {'correct': 0, 'total': 0, 'answers': []} for model in models}

        for i, quiz in enumerate(quiz_data):
            self.logger.info(f"[単一モデル] 問題 {i+1}/{len(quiz_data)}: {quiz['id']}")

            for model in models:
                response = await self.ask_single_model(model, quiz)

                is_correct = response['answer'] == quiz['correct_answer'] if response['answer'] else False
                results[model]['total'] += 1
                if is_correct:
                    results[model]['correct'] += 1

                results[model]['answers'].append({
                    'quiz_id': quiz['id'],
                    'question': quiz['question'],
                    'correct_answer': quiz['correct_answer'],
                    'model_answer': response['answer'],
                    'is_correct': is_correct,
                    'raw_response': response['raw_response'],
                    'error': response['error']
                })

                self.logger.info(f"  {model}: {response['answer']} (正解: {quiz['correct_answer']}) - {'○' if is_correct else '×'}")

            # レート制限対策 - 問題ごとに待機
            self.logger.info(f"  Sleeping {self.SLEEP_BETWEEN_QUESTIONS}s to avoid rate limits...")
            await asyncio.sleep(self.SLEEP_BETWEEN_QUESTIONS)

        # 精度計算
        for model in models:
            results[model]['accuracy'] = results[model]['correct'] / results[model]['total'] if results[model]['total'] > 0 else 0

        return results

    async def ask_ensemble(self, quiz: Dict[str, Any]) -> Dict[str, Any]:
        """アンサンブルモデルで質問"""
        # 3つのモデルに並列で質問
        models = [self.LLAMA_31_8B, self.LLAMA_33_70B, self.AZURE_GPT5]
        tasks = [self.ask_single_model(model, quiz) for model in models]
        individual_responses = await asyncio.gather(*tasks)

        # 有効な回答のみ抽出
        valid_responses = [r for r in individual_responses if r['answer'] is not None]

        if not valid_responses:
            return {
                'final_answer': None,
                'confidence': 0.0,
                'individual_responses': individual_responses,
                'synthesis_method': 'no_valid_responses',
                'fallback': True,
                'fallback_reason': 'All models failed to provide valid answers',
                'error': 'All models failed to provide valid answers'
            }

        # Qwenモデルで統合
        synthesis_result = await self._synthesize_with_qwen(quiz, valid_responses)

        return {
            'final_answer': synthesis_result['answer'],
            'confidence': synthesis_result['confidence'],
            'individual_responses': individual_responses,
            'synthesis_method': 'majority_vote' if synthesis_result.get('fallback') else 'qwen',
            'synthesis_reasoning': synthesis_result.get('reasoning'),
            'fallback': synthesis_result.get('fallback', False),
            'fallback_reason': synthesis_result.get('fallback_reason'),
            'error': None
        }

    async def _synthesize_with_qwen(self, quiz: Dict[str, Any], responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Qwenモデルで複数の回答を統合"""
        # 各モデルの回答をまとめる
        responses_summary = "\n".join([
            f"- {r['model']}: 選択肢 {r['answer']} を選択\n  理由: {r['raw_response'][:200]}"
            for r in responses
        ])

        synthesis_prompt = f"""あなたは循環器領域の専門医です。
以下のクイズに対して、3つの異なるAIモデルが回答を出しました。
これらの回答を総合的に判断し、最も適切な選択肢を1つ選んでください。

【問題】
{quiz['question']}

【選択肢】
1. {quiz['option1']}
2. {quiz['option2']}
3. {quiz['option3']}
4. {quiz['option4']}

【各モデルの回答】
{responses_summary}

【指示】
複数のモデルの回答を参考にし、最も医学的に妥当な選択肢を1つ選んでください。
以下のJSON形式で回答してください：

{{
    "final_answer": 1または2または3または4,
    "confidence": 0.0から1.0の信頼度,
    "reasoning": "選択した理由の簡潔な説明"
}}
"""

        try:
            response = self.cerebras_client.chat.completions.create(
                model=self.QWEN_INSTRUCT,
                messages=[{"role": "user", "content": synthesis_prompt}],
                max_completion_tokens=500,
                temperature=0.2
            )

            content = response.choices[0].message.content

            # JSONを抽出
            import re
            json_match = re.search(r'\{[^}]+\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                return {
                    'answer': result.get('final_answer'),
                    'confidence': result.get('confidence', 0.5),
                    'reasoning': result.get('reasoning', ''),
                    'fallback': False,
                    'fallback_reason': None
                }
            else:
                # JSONパースに失敗した場合は多数決
                self.logger.warning(f"  ⚠️  Qwen JSON parse failed, falling back to majority vote")
                fallback_result = self._majority_vote(responses)
                fallback_result['fallback'] = True
                fallback_result['fallback_reason'] = 'JSON parse failed'
                return fallback_result

        except Exception as e:
            self.logger.error(f"  ⚠️  Qwen synthesis error: {e}, falling back to majority vote")
            # エラー時は多数決にフォールバック
            fallback_result = self._majority_vote(responses)
            fallback_result['fallback'] = True
            fallback_result['fallback_reason'] = f'Qwen error: {str(e)}'
            return fallback_result

    def _majority_vote(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """多数決で回答を決定"""
        from collections import Counter

        answers = [r['answer'] for r in responses if r['answer'] is not None]
        if not answers:
            return {'answer': None, 'confidence': 0.0, 'reasoning': 'No valid answers'}

        vote_counts = Counter(answers)
        most_common = vote_counts.most_common(1)[0]

        return {
            'answer': most_common[0],
            'confidence': most_common[1] / len(answers),
            'reasoning': f'Majority vote: {most_common[1]}/{len(answers)} models agreed'
        }

    async def evaluate_ensemble(self, quiz_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """アンサンブルモデルでの評価"""
        results = {'correct': 0, 'total': 0, 'answers': []}

        for i, quiz in enumerate(quiz_data):
            self.logger.info(f"[アンサンブル] 問題 {i+1}/{len(quiz_data)}: {quiz['id']}")

            response = await self.ask_ensemble(quiz)

            is_correct = response['final_answer'] == quiz['correct_answer'] if response['final_answer'] else False
            results['total'] += 1
            if is_correct:
                results['correct'] += 1

            results['answers'].append({
                'quiz_id': quiz['id'],
                'question': quiz['question'],
                'correct_answer': quiz['correct_answer'],
                'ensemble_answer': response['final_answer'],
                'is_correct': is_correct,
                'confidence': response['confidence'],
                'synthesis_method': response.get('synthesis_method'),
                'fallback': response.get('fallback', False),
                'fallback_reason': response.get('fallback_reason'),
                'individual_responses': response['individual_responses'],
                'synthesis_reasoning': response.get('synthesis_reasoning'),
                'error': response.get('error')
            })

            fallback_indicator = " [多数決フォールバック]" if response.get('fallback') else ""
            self.logger.info(f"  アンサンブル: {response['final_answer']} (正解: {quiz['correct_answer']}, 信頼度: {response['confidence']:.2f}) - {'○' if is_correct else '×'}{fallback_indicator}")

            # レート制限対策
            self.logger.info(f"  Sleeping {self.SLEEP_AFTER_ENSEMBLE}s...")
            await asyncio.sleep(self.SLEEP_AFTER_ENSEMBLE)

        results['accuracy'] = results['correct'] / results['total'] if results['total'] > 0 else 0

        return results

    def save_results(self, single_results: Dict[str, Any], ensemble_results: Dict[str, Any], output_dir: str, dataset_name: str = 'evaluation'):
        """結果を保存"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # 詳細結果をJSON保存
        results_data = {
            'timestamp': timestamp,
            'dataset_name': dataset_name,
            'single_model_results': single_results,
            'ensemble_results': ensemble_results
        }

        output_path = os.path.join(output_dir, f'{dataset_name}_results_{timestamp}.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results_data, f, ensure_ascii=False, indent=2)

        print(f"\n結果を保存しました: {output_path}")

        # サマリーをテキスト保存
        summary_path = os.path.join(output_dir, f'{dataset_name}_summary_{timestamp}.txt')
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write("=" * 60 + "\n")
            f.write("循環器ガイドライン4択クイズ 評価結果\n")
            f.write("=" * 60 + "\n\n")

            f.write("【単一モデルの結果】\n")
            for model, result in single_results.items():
                f.write(f"  {model}: {result['correct']}/{result['total']} 問正解 (正答率: {result['accuracy']*100:.1f}%)\n")

            f.write(f"\n【アンサンブルモデルの結果】\n")
            f.write(f"  アンサンブル: {ensemble_results['correct']}/{ensemble_results['total']} 問正解 (正答率: {ensemble_results['accuracy']*100:.1f}%)\n")

            f.write(f"\n【改善率】\n")
            best_single = max(single_results.values(), key=lambda x: x['accuracy'])
            improvement = (ensemble_results['accuracy'] - best_single['accuracy']) * 100
            f.write(f"  最良単一モデル比: {improvement:+.1f} ポイント\n")

        print(f"サマリーを保存しました: {summary_path}")

        return output_path, summary_path


async def evaluate_single_csv(evaluator: 'QuizEvaluator', csv_path: str, output_dir: str, logger) -> Dict[str, Any]:
    """単一のCSVファイルを評価"""
    csv_name = os.path.basename(csv_path).replace('.csv', '')

    logger.info("\n" + "=" * 70)
    logger.info(f"📊 データセット: {csv_name}")
    logger.info("=" * 70)

    # クイズデータ読み込み
    quiz_data = evaluator.load_quiz_data(csv_path)
    logger.info(f"クイズデータ読み込み完了: {len(quiz_data)} 問\n")

    # 単一モデル評価
    logger.info("=" * 60)
    logger.info("単一モデルでの評価を開始します")
    logger.info("=" * 60)
    single_results = await evaluator.evaluate_single_models(quiz_data)

    logger.info("\n" + "=" * 60)
    logger.info("単一モデル評価結果")
    logger.info("=" * 60)
    for model, result in single_results.items():
        logger.info(f"{model}: {result['correct']}/{result['total']} 問正解 (正答率: {result['accuracy']*100:.1f}%)")

    # アンサンブル評価
    logger.info("\n" + "=" * 60)
    logger.info("アンサンブルモデルでの評価を開始します")
    logger.info("=" * 60)
    ensemble_results = await evaluator.evaluate_ensemble(quiz_data)

    logger.info("\n" + "=" * 60)
    logger.info("アンサンブル評価結果")
    logger.info("=" * 60)
    logger.info(f"アンサンブル: {ensemble_results['correct']}/{ensemble_results['total']} 問正解 (正答率: {ensemble_results['accuracy']*100:.1f}%)")

    # フォールバック統計
    fallback_count = sum(1 for ans in ensemble_results['answers'] if ans.get('fallback'))
    logger.info(f"多数決フォールバック回数: {fallback_count}/{ensemble_results['total']} 問")

    # 結果保存
    evaluator.save_results(single_results, ensemble_results, output_dir, dataset_name=csv_name)

    # 改善率の表示
    best_single = max(single_results.values(), key=lambda x: x['accuracy'])
    improvement = (ensemble_results['accuracy'] - best_single['accuracy']) * 100
    logger.info(f"\n改善率: 最良単一モデル比 {improvement:+.1f} ポイント")

    return {
        'dataset_name': csv_name,
        'single_results': single_results,
        'ensemble_results': ensemble_results,
        'improvement': improvement,
        'fallback_count': fallback_count
    }


async def main():
    """メイン実行関数"""
    # 環境変数を読み込み
    from dotenv import load_dotenv
    load_dotenv('/Users/naoto/EHR_MVP/.env')

    # 結果保存ディレクトリ
    output_dir = '/Users/naoto/EHR_MVP/evaluation/results'
    os.makedirs(output_dir, exist_ok=True)

    # ログファイルのパス
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(output_dir, f'evaluation_{timestamp}.log')

    # ログ設定
    logger = setup_logger(log_file)
    logger.info("=" * 70)
    logger.info("循環器ガイドライン4択クイズ 評価システム起動")
    logger.info("=" * 70)
    logger.info(f"ログファイル: {log_file}")

    # 評価システム初期化
    evaluator = QuizEvaluator(logger=logger)

    # データディレクトリから全CSVファイルを取得
    data_dir = '/Users/naoto/EHR_MVP/evaluation/data'
    csv_files = sorted([f for f in os.listdir(data_dir) if f.endswith('.csv')])

    if not csv_files:
        logger.error("エラー: データディレクトリにCSVファイルが見つかりません")
        return

    logger.info(f"📁 検出されたデータセット: {len(csv_files)} 件")
    for csv_file in csv_files:
        logger.info(f"  - {csv_file}")

    # 全データセットの評価結果を格納
    all_results = []

    # 各CSVファイルを順次評価
    for csv_file in csv_files:
        csv_path = os.path.join(data_dir, csv_file)
        result = await evaluate_single_csv(evaluator, csv_path, output_dir, logger)
        all_results.append(result)

    # 統合サマリーを生成
    logger.info("\n" + "=" * 70)
    logger.info("📈 全データセット統合結果")
    logger.info("=" * 70)

    for result in all_results:
        logger.info(f"\n【{result['dataset_name']}】")
        for model, res in result['single_results'].items():
            logger.info(f"  {model}: {res['accuracy']*100:.1f}%")
        logger.info(f"  アンサンブル: {result['ensemble_results']['accuracy']*100:.1f}% (改善: {result['improvement']:+.1f}pt, フォールバック: {result['fallback_count']}回)")

    # 全データセット統合サマリーをテキスト保存
    integrated_summary_path = os.path.join(output_dir, f'integrated_summary_{timestamp}.txt')

    with open(integrated_summary_path, 'w', encoding='utf-8') as f:
        f.write("=" * 70 + "\n")
        f.write("循環器ガイドライン4択クイズ 統合評価結果\n")
        f.write("=" * 70 + "\n\n")

        for result in all_results:
            f.write(f"【{result['dataset_name']}】\n")
            f.write("-" * 60 + "\n")
            f.write("単一モデル:\n")
            for model, res in result['single_results'].items():
                f.write(f"  {model}: {res['correct']}/{res['total']} 問正解 ({res['accuracy']*100:.1f}%)\n")
            f.write(f"\nアンサンブル:\n")
            f.write(f"  {result['ensemble_results']['correct']}/{result['ensemble_results']['total']} 問正解 ({result['ensemble_results']['accuracy']*100:.1f}%)\n")
            f.write(f"  改善率: {result['improvement']:+.1f} ポイント\n")
            f.write(f"  多数決フォールバック: {result['fallback_count']} 回\n\n")

    logger.info(f"\n✅ 統合サマリー保存: {integrated_summary_path}")
    logger.info(f"✅ ログファイル: {log_file}")
    logger.info("\n" + "=" * 70)
    logger.info("評価完了!")
    logger.info("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
