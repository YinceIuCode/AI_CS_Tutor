param(
    [Parameter(Position=0)]
    [string]$Target = ""
)

$RootDir = Split-Path $PSScriptRoot -Parent

switch ($Target.ToLower()) {
    { $_ -in "web", "frontend" } {
        Write-Host "[Runner] Moving to 'web' and starting Next.js dev server..." -ForegroundColor Cyan
        Set-Location "$RootDir\web"
        if (-not (Test-Path "node_modules")) {
            Write-Host "[Runner] node_modules not found. Installing dependencies..." -ForegroundColor Yellow
            npm install
        }
        npm run dev
    }
    { $_ -in "api", "backend" } {
        Write-Host "[Runner] Moving to 'api' and starting FastAPI backend server..." -ForegroundColor Green
        Set-Location "$RootDir\api"
        
        $venvPython = "$RootDir\api\.venv\Scripts\python.exe"
        $venvPythonAlt = "$RootDir\api\venv\Scripts\python.exe"
        
        if (Test-Path $venvPython) {
            & $venvPython -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
        } elseif (Test-Path $venvPythonAlt) {
            & $venvPythonAlt -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
        } else {
            python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
        }
    }
    default {
        Write-Host "========================================================" -ForegroundColor Magenta
        Write-Host "  [AI CS Tutor] Service Runner" -ForegroundColor Yellow
        Write-Host "========================================================" -ForegroundColor Magenta
        Write-Host "  Usage:" -ForegroundColor White
        Write-Host "    .\scripts\run web  : cd web & npm run dev (Port 3000)" -ForegroundColor Cyan
        Write-Host "    .\scripts\run api  : cd api & python uvicorn host (Port 8000)" -ForegroundColor Green
        Write-Host "    npm run web        : quick run via npm" -ForegroundColor Cyan
        Write-Host "    npm run api        : quick run via npm" -ForegroundColor Green
        Write-Host "========================================================" -ForegroundColor Magenta
    }
}
