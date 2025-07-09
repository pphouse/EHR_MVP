#!/bin/bash

echo "Starting EHR MVP Backend..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file with default values..."
    cat > .env << EOF
DATABASE_URL=sqlite:///./ehr_mvp.db
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:3000
EOF
fi

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Check if demo data should be created
if [ ! -f "ehr_mvp.db" ] || [ ! -s "ehr_mvp.db" ]; then
    echo "Database is empty. Creating demo data..."
    if [ -f "create_demo_user.py" ]; then
        python create_demo_user.py
    fi
    if [ -f "create_sample_data.py" ]; then
        python create_sample_data.py
    fi
    if [ -f "create_sample_medications.py" ]; then
        python create_sample_medications.py
    fi
fi

# Start the server
echo "Starting backend server on http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo "Press Ctrl+C to stop the server"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000