#!/bin/bash

# スクリプトのディレクトリに移動
cd "$(dirname "$0")"

# バックエンドを起動
echo "バックエンドを起動しています..."
cd backend
source venv/bin/activate
export DATABASE_URL=postgresql://ehr_user@localhost:5432/ehr_mvp
export REDIS_URL=redis://localhost:6379/0
export SECRET_KEY=dev-secret-key-do-not-use-in-production
export CORS_ORIGINS='["http://localhost:3000", "http://localhost:8080"]'
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "バックエンドPID: $BACKEND_PID"

# バックエンドの起動を待つ
echo "バックエンドの起動を待っています..."
sleep 5

# バックエンドの状態確認
curl -s http://localhost:8000/docs > /dev/null
if [ $? -eq 0 ]; then
    echo "バックエンドが正常に起動しました"
else
    echo "バックエンドの起動に失敗しました"
    exit 1
fi

# フロントエンドを起動
echo "フロントエンドを起動しています..."
cd ../frontend
npm start &
FRONTEND_PID=$!
echo "フロントエンドPID: $FRONTEND_PID"

# フロントエンドの起動を待つ
echo "フロントエンドの起動を待っています..."
sleep 10

echo "サービスが起動しました"
echo "フロントエンド: http://localhost:3000"
echo "API ドキュメント: http://localhost:8000/docs"

# 終了時にプロセスをクリーンアップ
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

# プロセスを維持
wait