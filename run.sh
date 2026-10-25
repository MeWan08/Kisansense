#!/usr/bin/env bash
# KisanSense task runner for Git Bash / WSL / Linux
# Usage: ./run.sh [task]
# Tasks: data, validate, train, test, lint, run, mlflow, docker, up, drift-demo, clean

set -e

# Automatically use the project's virtualenv if not already in PATH
VENV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.venv/Scripts"
if [ -d "$VENV_DIR" ]; then
  export PATH="$VENV_DIR:$PATH"
fi

export MLFLOW_DISABLE_TELEMETRY=true
export MLFLOW_DISABLE_AGENT_HINT=1
export PYTHONUTF8=1
PORT="${PORT:-8000}"
BASE="http://127.0.0.1:${PORT}"

case "$1" in
  data)
    python src/make_dataset.py
    ;;
  validate)
    python src/validate.py data/raw/Crop_recommendation.csv
    ;;
  train)
    python src/train.py
    python src/gate.py
    python src/promote.py
    ;;
  test)
    pytest -q
    ;;
  lint)
    ruff check src tests
    ;;
  run)
    export API_KEY=dev-key
    export MODEL_VERSION=local
    export PORT="$PORT"
    echo "Serving on ${BASE} (Ctrl+C to stop)..."
    python src/app.py
    ;;
  mlflow)
    mlflow ui --backend-store-uri sqlite:///mlflow.db --port 5000
    ;;
  docker)
    docker build --build-arg MODEL_VERSION=local -t kisansense:v1 .
    ;;
  up)
    docker compose up --build
    ;;
  drift-demo)
    export API_KEY="${API_KEY:-dev-key}"
    python src/simulate_drift.py "${BASE}" normal 300
    curl -s "${BASE}/drift" | python -m json.tool || true
    python src/simulate_drift.py "${BASE}" drift 500
    curl -s "${BASE}/drift" | python -m json.tool || true
    ;;
  clean)
    rm -rf mlflow.db mlruns mlartifacts model.joblib metrics.json data/reference.csv logs .pytest_cache .ruff_cache
    echo "Cleaned generated files."
    ;;
  *)
    echo "Usage: ./run.sh {data|validate|train|test|lint|run|mlflow|docker|up|drift-demo|clean}"
    exit 1
    ;;
esac
