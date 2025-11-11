@echo off
echo ========================================
echo ClimaSense AI Backend Setup
echo ========================================
echo.

echo Step 1: Creating Python virtual environment...
cd ai-backend
python -m venv venv
if errorlevel 1 (
    echo Error: Python not found or failed to create venv
    echo Please install Python 3.8+ from python.org
    pause
    exit /b 1
)
echo ✓ Virtual environment created
echo.

echo Step 2: Activating virtual environment...
call venv\Scripts\activate
echo ✓ Virtual environment activated
echo.

echo Step 3: Upgrading pip...
python -m pip install --upgrade pip
echo ✓ Pip upgraded
echo.

echo Step 4: Installing requirements...
echo This may take 5-10 minutes (downloading AI models)...
pip install -r requirements.txt
if errorlevel 1 (
    echo Error: Failed to install requirements
    pause
    exit /b 1
)
echo ✓ Requirements installed
echo.

echo Step 5: Creating .env file...
if not exist ".env" (
    copy .env.example .env
    echo ✓ .env file created - please add your Hugging Face API key
) else (
    echo ℹ .env file already exists
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit ai-backend\.env and add your HUGGINGFACE_API_KEY
echo 2. Run: start-ai-backend.bat
echo 3. Open http://localhost:5170/chat in your browser
echo.
echo For more info, see AI_INTEGRATION_GUIDE.md
echo.
pause
