@echo off
REM EduNexa frontend launcher (Windows) - static server on port 5500
REM Run this AFTER run_backend.bat, in a second Command Prompt window.
cd /d "%~dp0Edunexa_frontend"
python -m http.server 5500
pause