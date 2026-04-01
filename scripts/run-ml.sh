#!/usr/bin/env bash
# Start FastAPI ML service on port 8000 (uses ml-service/venv if present)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/ml-service"

if [[ -f venv/bin/activate ]]; then
  # shellcheck source=/dev/null
  source venv/bin/activate
fi

exec python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
