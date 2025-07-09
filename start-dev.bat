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

REM Check if ports are available
netstat -ano | findstr :8000 > nul
if %errorlevel% == 0 (
    echo Error: Port 8000 is already in use!
    echo Please stop the service using port 8000.
    pause
    exit /b 1
)

netstat -ano | findstr :3000 > nul
if %errorlevel% == 0 (
    echo Error: Port 3000 is already in use!
    echo Please stop the service using port 3000.
    pause
    exit /b 1
)

REM Prepare Backend
echo.
echo Preparing Backend Service...
echo.

cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file with default values...
    (
        echo DATABASE_URL=sqlite:///./ehr_mvp.db
        echo SECRET_KEY=dev-secret-key-change-in-production
        echo ALGORITHM=HS256
        echo ACCESS_TOKEN_EXPIRE_MINUTES=30
        echo FRONTEND_URL=http://localhost:3000
    ) > .env
)

REM Update config.py for Pydantic v2 if needed
powershell -Command "(Get-Content app\core\config.py) -replace 'from pydantic import BaseSettings, validator', 'from pydantic_settings import BaseSettings`nfrom pydantic import validator' | Set-Content app\core\config.py"

REM Update schemas for Pydantic v2
powershell -Command "Get-ChildItem app\schemas -Filter *.py | ForEach-Object { (Get-Content $_.FullName) -replace 'orm_mode = True', 'from_attributes = True' | Set-Content $_.FullName }"

cd ..

REM Prepare Frontend
echo.
echo Preparing Frontend Service...
echo.

cd frontend

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file with default values...
    (
        echo DANGEROUSLY_DISABLE_HOST_CHECK=true
        echo SKIP_PREFLIGHT_CHECK=true
        echo REACT_APP_API_URL=http://localhost:8000/api/v1
    ) > .env
)

cd ..

REM Start Backend in new window
echo.
echo Starting Backend Service in new window...
echo.

start "EHR Backend" cmd /k "cd backend && call venv\Scripts\activate && pip install -r requirements.txt && alembic upgrade head && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a bit for backend to start
timeout /t 5 /nobreak > nul

REM Start Frontend in new window
echo.
echo Starting Frontend Service in new window...
echo.

start "EHR Frontend" cmd /k "cd frontend && npm install && npm start"

echo.
echo ========================================
echo Services are starting in separate windows!
echo.
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Frontend: http://localhost:3000
echo.
echo Demo login credentials (if created):
echo Username: demo_doctor
echo Password: demo123
echo.
echo Close the command windows to stop services
echo ========================================
echo.

pause