"""KisanSense serving API (Flask).

Endpoints
  GET  /health    liveness and readiness, reports model version
  POST /predict   top-3 crop recommendations (needs x-api-key header)
  GET  /drift     current drift report over the rolling window of recent requests
  GET  /metrics   Prometheus metrics (latency, counts, drift gauges)

Every request is logged to stdout as one JSON line, ready for CloudWatch, Loki or `kubectl logs`.
Run with a single gunicorn worker (several threads) so the in-memory window and
Prometheus counters stay consistent. Scale with pods, not workers.
"""
import json
import logging
import os
import sys
import threading
import time
from collections import deque

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from prometheus_client import (CONTENT_TYPE_LATEST, Counter, Gauge, Histogram,
                               generate_latest)

from config import FEATURES, LOW_CONFIDENCE, RANGES, WINDOW_SIZE
from drift import drift_report

MODEL_PATH = os.getenv("MODEL_PATH", "model.joblib")
REFERENCE_PATH = os.getenv("REFERENCE_PATH", "data/reference.csv")
API_KEY = os.getenv("API_KEY", "dev-key")
MODEL_VERSION = os.getenv("MODEL_VERSION", "dev")
REQUEST_LOG = os.getenv("REQUEST_LOG", "")  # optional file for offline drift analysis

# ---- structured logging -------------------------------------------------------------
class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {"ts": round(time.time(), 3), "level": record.levelname,
                   "msg": record.getMessage()}
        payload.update(getattr(record, "extra_fields", {}))
        return json.dumps(payload)


handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JsonFormatter())
log = logging.getLogger("kisansense")
log.addHandler(handler)
log.setLevel(logging.INFO)
log.propagate = False


def log_event(msg, **fields):
    log.info(msg, extra={"extra_fields": fields})


# ---- model, reference data, metrics -------------------------------------------------
app = Flask(__name__)
CORS(app)
model = joblib.load(MODEL_PATH)
reference = pd.read_csv(REFERENCE_PATH) if os.path.exists(REFERENCE_PATH) else None

window = deque(maxlen=WINDOW_SIZE)
window_lock = threading.Lock()
_drift_cache = {"t": 0.0, "report": None}

HTTP_REQS = Counter("http_requests_total", "HTTP requests", ["endpoint", "status"])
LATENCY = Histogram("predict_latency_seconds", "Prediction latency",
                    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1.0))
PRED_BY_CROP = Counter("predictions_total", "Predictions by top crop", ["crop"])
LOW_CONF = Counter("low_confidence_predictions_total", "Top confidence below threshold")
DRIFT_FLAG = Gauge("drift_detected", "1 when input drift is detected on the rolling window")
DRIFT_KS = Gauge("feature_drift_ks", "KS statistic per feature", ["feature"])
WINDOW_N = Gauge("drift_window_samples", "Requests currently in the drift window")
MODEL_INFO = Gauge("model_info", "Model version in use", ["version"])
MODEL_INFO.labels(version=MODEL_VERSION).set(1)


def current_drift(max_age: float = 15.0) -> dict:
    """Compute (and briefly cache) the drift report, and refresh the gauges."""
    if reference is None:
        return {"enough_data": False, "drift": False, "features": {}, "n_live": 0,
                "drifted_features": [], "note": "no reference data loaded"}
    now = time.time()
    if _drift_cache["report"] is None or now - _drift_cache["t"] > max_age:
        with window_lock:
            live = pd.DataFrame(list(window), columns=FEATURES)
        report = drift_report(reference, live)
        _drift_cache.update(t=now, report=report)
        DRIFT_FLAG.set(1 if report["drift"] else 0)
        WINDOW_N.set(report["n_live"])
        for f, r in report["features"].items():
            DRIFT_KS.labels(feature=f).set(r["ks"])
    return _drift_cache["report"]


@app.after_request
def count_request(resp):
    if request.endpoint:
        HTTP_REQS.labels(endpoint=request.endpoint, status=str(resp.status_code)).inc()
    return resp


# ---- routes -------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION}


@app.get("/metrics")
def metrics():
    current_drift()
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}


@app.get("/drift")
def drift():
    return jsonify(current_drift(max_age=0))


@app.post("/predict")
def predict():
    if request.headers.get("x-api-key") != API_KEY:
        log_event("rejected", reason="bad_api_key")
        return jsonify(error="unauthorized"), 401
    body = request.get_json(silent=True) or {}
    try:
        x = [float(body[f]) for f in FEATURES]
    except (KeyError, TypeError, ValueError):
        return jsonify(error=f"need numeric fields: {FEATURES}"), 400
    for name, value in zip(FEATURES, x):
        lo, hi = RANGES[name]
        if not lo <= value <= hi:
            return jsonify(error=f"{name}={value} outside [{lo}, {hi}]"), 422

    t0 = time.time()
    proba = model.predict_proba(pd.DataFrame([x], columns=FEATURES))[0]
    top = np.argsort(proba)[::-1][:3]
    recs = [{"crop": str(model.classes_[i]), "confidence": round(float(proba[i]), 3)} for i in top]
    elapsed = time.time() - t0

    LATENCY.observe(elapsed)
    PRED_BY_CROP.labels(crop=recs[0]["crop"]).inc()
    low = recs[0]["confidence"] < LOW_CONFIDENCE
    if low:
        LOW_CONF.inc()
    with window_lock:
        window.append(x)
    if REQUEST_LOG:
        with open(REQUEST_LOG, "a") as fh:
            fh.write(json.dumps(dict(zip(FEATURES, x), ts=round(t0, 3))) + "\n")

    log_event("prediction", model_version=MODEL_VERSION, top_crop=recs[0]["crop"],
              confidence=recs[0]["confidence"], latency_ms=round(elapsed * 1000, 2))
    out = {"model_version": MODEL_VERSION, "recommendations": recs}
    if low:
        out["advice"] = "Low confidence. Please consult your local agriculture officer."
    return jsonify(out)


if __name__ == "__main__":
    # local dev server only; containers use gunicorn on 8080 (see Dockerfile)
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")), threaded=True)
