@echo off
setlocal enabledelayedexpansion

set TARGET=%~1

if /I "%TARGET%"=="web" goto RUN_WEB
if /I "%TARGET%"=="frontend" goto RUN_WEB
if /I "%TARGET%"=="api" goto RUN_API
if /I "%TARGET%"=="backend" goto RUN_API

echo ========================================================
echo   [AI CS Tutor] Service Runner
echo ========================================================
echo   Usage:
echo     scripts\run web   : cd web ^& npm run dev (Port 3000)
echo     scripts\run api   : cd api ^& python uvicorn host (Port 8000)
echo     npm run web       : quick run via npm
echo     npm run api       : quick run via npm
echo ========================================================
exit /b 1

:RUN_WEB
echo [Runner] Moving to 'web' and starting Next.js dev server...
cd /d "%~dp0..\web"
if not exist "node_modules" (
    echo [Runner] node_modules not found. Installing dependencies...
    call npm install
)
call npm run dev
goto :EOF

:RUN_API
echo [Runner] Moving to 'api' and starting FastAPI backend server...
cd /d "%~dp0..\api"
if exist ".venv\Scripts\python.exe" (
    call ".venv\Scripts\activate.bat" 2>nul
    ".venv\Scripts\python.exe" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
) else if exist "venv\Scripts\python.exe" (
    call "venv\Scripts\activate.bat" 2>nul
    "venv\Scripts\python.exe" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
) else (
    python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
)
goto :EOF
