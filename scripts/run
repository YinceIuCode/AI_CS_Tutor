#!/usr/bin/env bash

TARGET="$1"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"

case "$TARGET" in
  web|frontend)
    echo "[Runner] Moving to 'web' and starting Next.js dev server..."
    cd "$DIR/web" || exit 1
    if [ ! -d "node_modules" ]; then
      echo "[Runner] node_modules not found. Installing dependencies..."
      npm install
    fi
    npm run dev
    ;;
  api|backend)
    echo "[Runner] Moving to 'api' and starting FastAPI backend server..."
    cd "$DIR/api" || exit 1
    if [ -f ".venv/Scripts/activate" ]; then
      source .venv/Scripts/activate
    elif [ -f ".venv/bin/activate" ]; then
      source .venv/bin/activate
    elif [ -f "venv/Scripts/activate" ]; then
      source venv/Scripts/activate
    elif [ -f "venv/bin/activate" ]; then
      source venv/bin/activate
    fi
    python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
    ;;
  *)
    echo "========================================================"
    echo "  [AI CS Tutor] Service Runner"
    echo "========================================================"
    echo "  Usage:"
    echo "    ./scripts/run web : cd web & npm run dev (Port 3000)"
    echo "    ./scripts/run api : cd api & python uvicorn host (Port 8000)"
    echo "    npm run web       : quick run via npm"
    echo "    npm run api       : quick run via npm"
    echo "========================================================"
    exit 1
    ;;
esac
