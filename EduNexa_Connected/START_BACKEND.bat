@echo off
setlocal
cd /d "%~dp0backend"

if not exist venv\Scripts\python.exe (
    python -m venv venv
)

call venv\Scripts\activate
python -m pip install -r requirements.txt
python seed.py
python -m uvicorn app.main:app --reload --port 8000
