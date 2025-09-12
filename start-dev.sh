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

# Function to open new terminal window
open_new_terminal() {
    local title=$1
    local command=$2
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && $command\""
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux with gnome-terminal
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --title="$title" -- bash -c "cd $(pwd) && $command; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -title "$title" -e bash -c "cd $(pwd) && $command; exec bash" &
        else
            echo -e "${RED}No suitable terminal emulator found. Please run manually:${NC}"
            echo "$command"
        fi
    else
        echo -e "${RED}Unsupported OS. Please run manually:${NC}"
        echo "$command"
    fi
}

# Function to prepare backend
prepare_backend() {
    echo -e "${YELLOW}Preparing Backend Service...${NC}"
    
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
    
    # Update config.py imports if needed (Pydantic v2 compatibility)
    if grep -q "from pydantic import BaseSettings" app/core/config.py 2>/dev/null; then
        echo "Updating Pydantic imports for v2 compatibility..."
        sed -i.bak 's/from pydantic import BaseSettings, validator/from pydantic_settings import BaseSettings\nfrom pydantic import validator/' app/core/config.py
    fi
    
    # Update schemas for Pydantic v2 if needed
    find app/schemas -name "*.py" -type f -exec sed -i.bak 's/orm_mode = True/from_attributes = True/g' {} \;
    
    # Check if database exists
    if [ ! -f "ehr_mvp.db" ] || [ ! -s "ehr_mvp.db" ]; then
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
    
    cd ..
}

# Function to prepare frontend
prepare_frontend() {
    echo -e "${YELLOW}Preparing Frontend Service...${NC}"
    
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
DANGEROUSLY_DISABLE_HOST_CHECK=true
SKIP_PREFLIGHT_CHECK=true
REACT_APP_API_URL=http://localhost:8000/api/v1
EOF
    fi
    
    cd ..
}

# Main execution
echo "======================================"
echo "    EHR MVP Development Environment   "
echo "======================================"

# Function to force kill processes on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}Stopping existing processes on port $port...${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null
        sleep 2
        return 0
    fi
    return 1
}

# Check and clear ports if needed
if check_port 8000; then
    echo -e "${YELLOW}Port 8000 is in use. Attempting to free it...${NC}"
    kill_port 8000
    pkill -f "uvicorn.*app.main" 2>/dev/null
    sleep 2
    
    if check_port 8000; then
        echo -e "${RED}Unable to free port 8000. Please manually stop the service.${NC}"
        echo "Run: lsof -i :8000 to see what's using the port"
        exit 1
    else
        echo -e "${GREEN}Port 8000 freed successfully${NC}"
    fi
fi

if check_port 3000; then
    echo -e "${YELLOW}Port 3000 is in use. Attempting to free it...${NC}"
    kill_port 3000
    pkill -f "react-scripts" 2>/dev/null
    pkill -f "npm start" 2>/dev/null
    sleep 2
    
    if check_port 3000; then
        echo -e "${RED}Unable to free port 3000. Please manually stop the service.${NC}"
        echo "Run: lsof -i :3000 to see what's using the port"
        exit 1
    else
        echo -e "${GREEN}Port 3000 freed successfully${NC}"
    fi
fi

# Prepare services
prepare_backend
prepare_frontend

# Start services in new terminal windows
echo -e "\n${GREEN}Starting services in new terminal windows...${NC}"

# Start backend
echo -e "${YELLOW}Opening new terminal for Backend...${NC}"
open_new_terminal "EHR Backend" "./backend/start-backend.sh"

# Wait a bit for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start frontend
echo -e "${YELLOW}Opening new terminal for Frontend...${NC}"
open_new_terminal "EHR Frontend" "./frontend/start-frontend.sh"

echo -e "\n${GREEN}Services are starting in separate terminals!${NC}"
echo "======================================"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Frontend: http://localhost:3000"
echo "======================================"
echo ""
echo "Demo login credentials (if demo data was created):"
echo "Username: demo_doctor"
echo "Password: demo123"
echo ""
echo "To stop services, close the terminal windows or press Ctrl+C in each."