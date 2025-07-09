@echo off
REM EHR MVP Development Start Script for Windows
REM This script starts both backend and frontend services for development

echo ========================================
echo     EHR MVP Development Environment
echo ========================================

REM Check if running in the correct directory
if not exist "backend" (
    echo Error: backend directory not found!
    echo Please run this script from the EHR_MVP root directory.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo Error: frontend directory not found!
    echo Please run this script from the EHR_MVP root directory.
    pause
    exit /b 1
)

REM Start Backend
echo.
echo Starting Backend Service...
echo.

cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment and start backend
echo Starting backend server...
start cmd /k "venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

cd ..

REM Wait a bit for backend to start
timeout /t 5 /nobreak > nul

REM Start Frontend
echo.
echo Starting Frontend Service...
echo.

cd frontend

REM Install dependencies if needed and start frontend
start cmd /k "npm install && npm start"

cd ..

echo.
echo ========================================
echo Services are starting...
echo.
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Frontend: http://localhost:3000
echo.
echo Close the command windows to stop services
echo ========================================
echo.

pause