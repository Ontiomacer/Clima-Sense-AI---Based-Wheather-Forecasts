@echo off
title ClimaSense AI - Startup Manager
color 0A

echo.
echo ========================================
echo   ClimaSense AI - Starting Services
echo ========================================
echo.
echo Checking prerequisites...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python 3.11+ from https://python.org/
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node --version
echo [OK] Python found: 
python --version
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [WARNING] node_modules not found. Running npm install...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
)

REM Check if agrisense-mcp is built
if not exist "agrisense-mcp\dist\" (
    echo [WARNING] AgriSense MCP not built. Building...
    cd agrisense-mcp
    call npm install
    call npm run build
    cd ..
)

echo.
echo ========================================
echo   Starting Services...
echo ========================================
echo.

echo [1/5] Starting AI Backend (FastAPI)...
start "ClimaSense - AI Backend" cmd /k "python ai-backend/main.py"
timeout /t 3 /nobreak > nul
echo       Started on http://localhost:8000
echo.

echo [2/5] Starting AgriSense MCP Server...
start "ClimaSense - AgriSense MCP" cmd /k "cd agrisense-mcp && npm start"
timeout /t 2 /nobreak > nul
echo       Started on http://localhost:9090
echo.

echo [3/5] Starting GEE Backend Server...
start "ClimaSense - GEE Server" cmd /k "npm run gee-server"
timeout /t 2 /nobreak > nul
echo       Started on http://localhost:3001
echo.

echo [4/5] Starting AI Forecast Server...
start "ClimaSense - AI Forecast" cmd /k "npm run ai-forecast"
timeout /t 2 /nobreak > nul
echo       Started on http://localhost:3002
echo.

echo [5/5] Starting React Development Server...
start "ClimaSense - React Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul
echo       Started on http://localhost:5173
echo.

echo ========================================
echo   All Services Started Successfully!
echo ========================================
echo.
echo Access Points:
echo   Frontend:        http://localhost:5173
echo   AI Backend:      http://localhost:8000
echo   MCP Server:      http://localhost:9090
echo   MCP Dashboard:   http://localhost:9090/dashboard
echo   GEE Server:      http://localhost:3001
echo   AI Forecast:     http://localhost:3002
echo.
echo ========================================
echo.
echo Opening frontend in browser...
timeout /t 2 /nobreak > nul
start http://localhost:5173
echo.
echo All services are running in separate windows.
echo Close those windows to stop the services.
echo.
echo Press any key to exit this launcher...
pause > nul
