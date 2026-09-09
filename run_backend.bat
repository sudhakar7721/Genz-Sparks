@echo off
REM EduNexa backend launcher (Windows) - FastAPI on port 8000
cd /d "%~dp0Edunexa_backend"
if not exist .venv py -m venv .venv
call .venv\Scripts\activate
python -m pip install --quiet -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause