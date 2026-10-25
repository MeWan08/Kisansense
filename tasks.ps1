# Windows (PowerShell) equivalent of the Makefile.
# Usage:  .\tasks.ps1 <task>
#   setup, data, validate, train, test, lint, run, mlflow, docker, up, drift-demo, clean
# gunicorn does not run on Windows, so `run` uses Flask's built-in threaded server.
# Production (Docker / Kubernetes) still uses gunicorn, see Dockerfile.
param([Parameter(Position = 0)][string]$Task = "help")

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$env:MLFLOW_DISABLE_TELEMETRY = "true"
$env:MLFLOW_DISABLE_AGENT_HINT = "1"   # MLflow 3 prints a hint on stderr that PowerShell shows in red
$env:PYTHONUTF8 = "1"             # avoid cp1252 UnicodeEncodeError from library output
# Local API port. 8080 is often taken on Windows (Steam's web helper uses it). Containers still use 8080.
if (-not $env:PORT) { $env:PORT = "8000" }
$Base = "http://127.0.0.1:$($env:PORT)"

function Invoke-Step([string]$cmd) {
    Write-Host ">> $cmd" -ForegroundColor Cyan
    Invoke-Expression $cmd
    if ($LASTEXITCODE -ne 0) { throw "failed (exit $LASTEXITCODE): $cmd" }
}

switch ($Task) {
    "setup" {
        Invoke-Step "py -3.12 -m venv .venv"
        Invoke-Step ".\.venv\Scripts\python.exe -m pip install --upgrade pip"
        Invoke-Step ".\.venv\Scripts\python.exe -m pip install -r requirements.txt"
        Write-Host "now run: .\.venv\Scripts\Activate.ps1" -ForegroundColor Green
    }
    "data"     { Invoke-Step "python src/make_dataset.py" }
    "validate" { Invoke-Step "python src/validate.py data/raw/Crop_recommendation.csv" }
    "train" {
        Invoke-Step "python src/train.py"
        Invoke-Step "python src/gate.py"
        Invoke-Step "python src/promote.py"
    }
    "test"   { Invoke-Step "pytest -q" }
    "lint"   { Invoke-Step "ruff check src tests" }
    "run" {
        $env:API_KEY = "dev-key"; $env:MODEL_VERSION = "local"
        Write-Host "API on $Base  (Ctrl+C to stop)" -ForegroundColor Green
        Invoke-Step "python src/app.py"
    }
    "mlflow" { Invoke-Step "mlflow ui --backend-store-uri sqlite:///mlflow.db --port 5000" }
    "docker" { Invoke-Step "docker build --build-arg MODEL_VERSION=local -t kisansense:v1 ." }
    "up"     { Invoke-Step "docker compose up --build" }
    "drift-demo" {
        if (-not $env:API_KEY) { $env:API_KEY = "dev-key" }
        Invoke-Step "python src/simulate_drift.py $Base normal 300"
        Invoke-RestMethod "$Base/drift" | Select-Object drift, n_live, drifted_features | Format-List
        Invoke-Step "python src/simulate_drift.py $Base drift 500"
        Invoke-RestMethod "$Base/drift" | Select-Object drift, n_live, drifted_features | Format-List
    }
    "clean" {
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue `
            mlflow.db, mlruns, mlartifacts, model.joblib, metrics.json, data/reference.csv, logs, .pytest_cache
    }
    default {
        Write-Host "tasks: setup data validate train test lint run mlflow docker up drift-demo clean"
    }
}
