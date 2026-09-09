#!/usr/bin/env bash
# EduNexa full-stack launcher (Linux / macOS)
# Starts the FastAPI backend on :8000 and the frontend static server on :5500.
#
#   bash run.sh                 # default ports 8000 / 5500
#   EDUNEXA_PORT=8026 bash run.sh
#   EDUNEXA_WEB_PORT=5600 EDUNEXA_PORT=8026 bash run.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${EDUNEXA_PORT:-8000}"
WEB_PORT="${EDUNEXA_WEB_PORT:-5500}"

echo "==> EduNexa launcher ($(python3 --version))"

if ! python3 -c "import fastapi, uvicorn" 2>/dev/null; then
  echo "Backend dependencies missing. Installing into a virtual env under Edunexa_backend/.venv ..."
  ( cd "$DIR/Edunexa_backend" && python3 -m venv .venv \
    && ./.venv/bin/pip install --quiet --upgrade pip \
    && ./.venv/bin/pip install --quiet -r requirements.txt )
fi

if [ -x "$DIR/Edunexa_backend/.venv/bin/python" ]; then
  BACKEND_PY="$DIR/Edunexa_backend/.venv/bin/python"
else
  BACKEND_PY="$(command -v python3)"
fi

echo "==> Starting backend  -> http://127.0.0.1:$BACKEND_PORT  (Ctrl+C to stop both)"
( cd "$DIR/Edunexa_backend" && "$BACKEND_PY" -m app.init_db && exec "$BACKEND_PY" -m uvicorn app.main:app --host 127.0.0.1 --port "$BACKEND_PORT" ) &
BACKEND_PID=$!

echo "==> Starting frontend -> http://127.0.0.1:$WEB_PORT"
( cd "$DIR/Edunexa_frontend" && exec python3 -m http.server "$WEB_PORT" ) &
WEB_PID=$!

cleanup() { kill "$BACKEND_PID" "$WEB_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

sleep 2
echo
echo "Open: http://127.0.0.1:$WEB_PORT   (API docs: http://127.0.0.1:$BACKEND_PORT/docs)"
echo "If :$BACKEND_PORT is busy, edit this file or run:  EDUNEXA_PORT=8026 bash run.sh"
wait