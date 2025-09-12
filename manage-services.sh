#!/bin/bash

# EHR MVP Service Management Script
# Usage: ./manage-services.sh [start|stop|restart|status]

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_usage() {
    echo "EHR MVP Service Management"
    echo "Usage: $0 [start|stop|restart|status]"
    echo ""
    echo "Commands:"
    echo "  start    - Start both backend and frontend services"
    echo "  stop     - Stop all running services"
    echo "  restart  - Restart all services"
    echo "  status   - Check status of services"
}

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}Stopping processes on port $port...${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null
        sleep 1
        return 0
    fi
    return 1
}

stop_services() {
    echo -e "${YELLOW}Stopping EHR MVP services...${NC}"
    
    # Stop backend
    kill_port 8000
    pkill -f "uvicorn.*app.main" 2>/dev/null
    
    # Stop frontend
    kill_port 3000
    pkill -f "react-scripts" 2>/dev/null
    pkill -f "npm start" 2>/dev/null
    
    sleep 2
    echo -e "${GREEN}Services stopped${NC}"
}

start_services() {
    echo -e "${BLUE}Starting EHR MVP services...${NC}"
    
    # Check if ports are free, if not, stop existing services
    if check_port 8000 || check_port 3000; then
        echo -e "${YELLOW}Ports in use, stopping existing services...${NC}"
        stop_services
    fi
    
    # Start services using the main script
    ./start-dev.sh
}

check_status() {
    echo -e "${BLUE}EHR MVP Service Status:${NC}"
    echo "=========================="
    
    # Check backend
    if check_port 8000; then
        echo -e "Backend (port 8000): ${GREEN}RUNNING${NC}"
        backend_pid=$(lsof -ti:8000 2>/dev/null | head -1)
        if [ ! -z "$backend_pid" ]; then
            echo "  PID: $backend_pid"
        fi
    else
        echo -e "Backend (port 8000): ${RED}STOPPED${NC}"
    fi
    
    # Check frontend
    if check_port 3000; then
        echo -e "Frontend (port 3000): ${GREEN}RUNNING${NC}"
        frontend_pid=$(lsof -ti:3000 2>/dev/null | head -1)
        if [ ! -z "$frontend_pid" ]; then
            echo "  PID: $frontend_pid"
        fi
    else
        echo -e "Frontend (port 3000): ${RED}STOPPED${NC}"
    fi
    
    echo ""
    echo "URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
}

restart_services() {
    echo -e "${BLUE}Restarting EHR MVP services...${NC}"
    stop_services
    sleep 2
    start_services
}

# Main script logic
case "${1:-}" in
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "status")
        check_status
        ;;
    *)
        show_usage
        exit 1
        ;;
esac