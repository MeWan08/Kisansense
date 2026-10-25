# KisanSense: drift-aware crop advisory (MLOps project)

Takes soil readings (N, P, K, pH) and local weather (temperature, humidity, rainfall) and returns
the top 3 suitable crops with confidence scores. The point of the project is the machinery around
the model: versioned data, tracked experiments, a gated CI/CD pipeline, containers on Kubernetes,
monitoring, drift detection, and a retrain-and-promote loop.

Course: TE7940 MLOps Lab / TE7941 MLOps.

## Quick start (about 5 minutes, no cloud account)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python src/make_dataset.py        # synthetic stand-in; swap in the Kaggle CSV later
python src/validate.py data/raw/Crop_recommendation.csv
python src/train.py               # trains, logs to MLflow, writes model.joblib + metrics.json
python src/gate.py                # quality gate
python src/promote.py             # challenger -> champion in the MLflow registry
pytest -q

make run                          # API on http://localhost:8080
```

```bash
curl -X POST localhost:8080/predict -H "x-api-key: dev-key" -H "Content-Type: application/json" \
  -d '{"N":90,"P":42,"K":43,"temperature":21,"humidity":82,"ph":6.5,"rainfall":203}'
```

See drift detection work (API must be running):

```bash
python src/simulate_drift.py http://localhost:8080 normal 300   # /drift says false
python src/simulate_drift.py http://localhost:8080 drift 500    # /drift says true
curl localhost:8080/drift
```

MLflow UI: `mlflow ui --backend-store-uri sqlite:///mlflow.db` then open http://localhost:5000.

## Layout

| Path | Purpose |
|---|---|
| `src/` | validate, train, gate, promote, API, drift, simulators |
| `tests/` | pytest suite (API, drift, validation) |
| `params.yaml`, `dvc.yaml` | hyperparameters, quality thresholds, reproducible pipeline |
| `Dockerfile`, `docker-compose.yml` | image, plus local API + MLflow + Prometheus + Grafana |
| `k8s/` | Deployment, Service, HPA, canary, ServiceMonitor, alert rules, kustomization |
| `.github/workflows/` | `ci.yml` (test, gate, build, push, deploy), `retrain.yml` |
| `monitoring/` | Prometheus config, alert rules, Grafana dashboard |
| `docs/GUIDE.md` | the full step-by-step implementation guide, start here |
| `docs/PROBLEM_STATEMENTS.md` | alternative project ideas |
| `MODEL_CARD.md` | governance document to complete before submission |

## What was tested, and what was not

Tested end to end in a Linux sandbox: data generation, validation, training, MLflow registry and
aliases, quality gate, promotion and rollback, the DVC pipeline (with a local remote), the API,
drift detection over live traffic, pytest (16 tests), ruff, and YAML/JSON syntax of every config.

Not run here, so expect to fix small things: the Docker build, `docker compose up`, the Kubernetes
manifests on a real cluster, the GitHub Actions workflows, and anything touching AWS. The guide
lists the commands and the usual failures for each.

## Frontend workspace

The modular React UI lives in [frontend/](frontend/README.md), with live API integration, an explicit demo mode, editable connection settings, and model drift telemetry. Run npm ci and npm run dev from that directory. See its README for static hosting and Docker deployment.
