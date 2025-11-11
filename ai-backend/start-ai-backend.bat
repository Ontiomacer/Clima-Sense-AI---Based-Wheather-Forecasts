@echo off
echo Starting ClimaSense AI Backend...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install requirements
echo Installing/updating requirements...
pip install -r requirements.txt
echo.

REM Start the server
echo Starting FastAPI server on http://localhost:8000
echo.
python main.py

pause
