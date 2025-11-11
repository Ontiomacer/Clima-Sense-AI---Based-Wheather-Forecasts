@echo off
title ClimaSense AI - First Time Setup
color 0B

echo.
echo ========================================
echo   ClimaSense AI - First Time Setup
echo ========================================
echo.
echo This script will set up your development environment.
echo.
pause

REM Check Node.js
echo [1/6] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo [OK] Node.js found
echo.

REM Check Python
echo [2/6] Checking Python...
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found!
    echo Please install from: https://python.org/
    pause
    exit /b 1
)
python --version
echo [OK] Python found
echo.

REM Install frontend dependencies
echo [3/6] Installing frontend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend installation failed!
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
echo.

REM Install backend dependencies
echo [4/6] Installing backend dependencies...
cd ai-backend
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend installation failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Backend dependencies installed
echo.

REM Setup AgriSense MCP
echo [5/6] Setting up AgriSense MCP...
cd agrisense-mcp
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] AgriSense MCP setup failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] AgriSense MCP ready
echo.

REM Create .env file if not exists
echo [6/6] Checking environment configuration...
if not exist ".env" (
    echo Creating .env file...
    (
        echo VITE_SUPABASE_URL=your_supabase_url
        echo VITE_SUPABASE_ANON_KEY=your_supabase_key
        echo VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
    ) > .env
    echo [WARNING] .env file created with placeholder values
    echo Please edit .env and add your actual API keys
) else (
    echo [OK] .env file exists
)
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Edit .env file with your API keys
echo   2. Run: start-climasense.bat
echo   3. Open: http://localhost:5173
echo.
echo Documentation:
echo   - README.md - Project overview
echo   - SETUP_INSTRUCTIONS.md - Detailed setup
echo   - DEPLOYMENT.md - Deployment guide
echo.
echo ========================================
echo.
pause
