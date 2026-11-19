#!/usr/bin/env python3
import sys
import os
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

def run_web():
    web_dir = ROOT_DIR / "web"
    print(f"[Runner] Moving to '{web_dir}' and starting Next.js dev server...")
    node_modules = web_dir / "node_modules"
    if not node_modules.exists():
        print("[Runner] node_modules not found. Running npm install first...")
        subprocess.run(["npm", "install"], cwd=str(web_dir), shell=True)
    subprocess.run(["npm", "run", "dev"], cwd=str(web_dir), shell=True)

def run_api():
    api_dir = ROOT_DIR / "api"
    print(f"[Runner] Moving to '{api_dir}' and starting FastAPI backend server...")
    
    # Check virtual environment python
    venv_python = api_dir / ".venv" / "Scripts" / "python.exe"
    if not venv_python.exists():
        venv_python = api_dir / "venv" / "Scripts" / "python.exe"
    if not venv_python.exists():
        venv_python = api_dir / ".venv" / "bin" / "python"
    if not venv_python.exists():
        venv_python = api_dir / "venv" / "bin" / "python"
    
    python_cmd = str(venv_python) if venv_python.exists() else "python"
    cmd = [python_cmd, "-m", "uvicorn", "main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"]
    subprocess.run(cmd, cwd=str(api_dir))

def main():
    if len(sys.argv) < 2:
        print("========================================================")
        print("  [AI CS Tutor] Service Runner")
        print("========================================================")
        print("  Usage:")
        print("    python scripts/run.py web : cd web & npm run dev (Port 3000)")
        print("    python scripts/run.py api : cd api & python uvicorn host (Port 8000)")
        print("    npm run web               : quick run via npm")
        print("    npm run api               : quick run via npm")
        print("========================================================")
        sys.exit(1)
        
    target = sys.argv[1].lower()
    if target in ("web", "frontend"):
        run_web()
    elif target in ("api", "backend"):
        run_api()
    else:
        print(f"[Error] Unknown target: '{target}'")
        print("Valid options: 'web', 'api'")
        sys.exit(1)

if __name__ == "__main__":
    main()
