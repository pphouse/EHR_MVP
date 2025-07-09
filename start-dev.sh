#!/bin/bash

# EHR MVP Development Start Script
# This script starts both backend and frontend services for development

echo "🚀 Starting EHR MVP Development Environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to start backend
start_backend() {
    echo -e "${YELLOW}Starting Backend Service...${NC}"
    
    # Check if backend directory exists
    if [ ! -d "backend" ]; then
        echo -e "${RED}Error: backend directory not found!${NC}"
        exit 1
    fi
    
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies if requirements.txt has changed
    if [ "requirements.txt" -nt "venv/installed" ]; then
        echo "Installing/Updating Python dependencies..."
        pip install -r requirements.txt
        touch venv/installed
    fi
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}Warning: .env file not found in backend directory${NC}"
        echo "Creating .env file with default values..."
        cat > .env << EOF
DATABASE_URL=sqlite:///./ehr_mvp.db
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:3000
EOF
    fi
    
    # Check if database exists
    if [ ! -f "ehr_mvp.db" ]; then
        echo "Setting up database..."
        alembic upgrade head
        
        # Ask if user wants to create demo data
        read -p "Create demo data? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
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
    fi
    
    # Check if port 8000 is available
    if check_port 8000; then
        echo -e "${RED}Port 8000 is already in use!${NC}"
        echo "Please stop the service using port 8000 or use a different port."
        exit 1
    fi
    
    # Start backend server
    echo -e "${GREEN}Starting backend server on http://localhost:8000${NC}"
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    
    cd ..
}

# Function to start frontend
start_frontend() {
    echo -e "${YELLOW}Starting Frontend Service...${NC}"
    
    # Check if frontend directory exists
    if [ ! -d "frontend" ]; then
        echo -e "${RED}Error: frontend directory not found!${NC}"
        exit 1
    fi
    
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Installing Node.js dependencies..."
        npm install
    fi
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}Warning: .env file not found in frontend directory${NC}"
        echo "Creating .env file with default values..."
        cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
EOF
    fi
    
    # Check if port 3000 is available
    if check_port 3000; then
        echo -e "${RED}Port 3000 is already in use!${NC}"
        echo "Please stop the service using port 3000 or use a different port."
        exit 1
    fi
    
    # Start frontend server
    echo -e "${GREEN}Starting frontend server on http://localhost:3000${NC}"
    npm start &
    FRONTEND_PID=$!
    
    cd ..
}

# Function to stop services
stop_services() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    
    # Kill backend process
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "Backend stopped"
    fi
    
    # Kill frontend process
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "Frontend stopped"
    fi
    
    exit 0
}

# Set up trap to catch Ctrl+C
trap stop_services INT

# Main execution
echo "======================================"
echo "    EHR MVP Development Environment   "
echo "======================================"

# Start services
start_backend
sleep 5  # Wait for backend to start

start_frontend

echo -e "\n${GREEN}Services are starting...${NC}"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Frontend: http://localhost:3000"
echo -e "\nPress Ctrl+C to stop all services"

# Wait for services
wait