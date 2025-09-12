#!/bin/bash

echo "🛑 Stopping EHR MVP Services..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}Stopping processes on port $port...${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null
        echo -e "${GREEN}Port $port cleared${NC}"
    else
        echo -e "${GREEN}Port $port is already free${NC}"
    fi
}

# Function to kill processes by name
kill_by_name() {
    local name=$1
    echo -e "${YELLOW}Stopping $name processes...${NC}"
    pkill -f "$name" 2>/dev/null && echo -e "${GREEN}$name processes stopped${NC}" || echo -e "${GREEN}No $name processes found${NC}"
}

# Stop backend processes
echo "Stopping backend services..."
kill_port 8000
kill_by_name "uvicorn"
kill_by_name "python.*app.main"

# Stop frontend processes
echo "Stopping frontend services..."
kill_port 3000
kill_by_name "npm start"
kill_by_name "react-scripts"
kill_by_name "node.*react-scripts"

# Wait a moment for processes to terminate
sleep 2

# Verify ports are free
echo "Verifying ports are free..."
if lsof -i:8000 >/dev/null 2>&1; then
    echo -e "${RED}Warning: Port 8000 still in use${NC}"
else
    echo -e "${GREEN}Port 8000 is free${NC}"
fi

if lsof -i:3000 >/dev/null 2>&1; then
    echo -e "${RED}Warning: Port 3000 still in use${NC}"
else
    echo -e "${GREEN}Port 3000 is free${NC}"
fi

echo -e "${GREEN}All services stopped${NC}"