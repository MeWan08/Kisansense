"""Drift detection with the two-sample Kolmogorov-Smirnov test.

Compares live request features against the training reference, per feature.
Used by the API (rolling in-memory window) and as an offline CLI over a request log.

Usage: python src/drift.py logs/requests.jsonl
Exit code 2 means drift was detected, so a scheduler can trigger retraining.
"""
import json
import sys

import pandas as pd
from scipy.stats import ks_2samp

from config import (DRIFT_MIN_FEATURES, DRIFT_MIN_KS, DRIFT_MIN_SAMPLES, DRIFT_P_VALUE,
                    FEATURES)


def drift_report(reference: pd.DataFrame, live: pd.DataFrame) -> dict:
    """Return per-feature KS results and an overall flag."""
    if len(live) < DRIFT_MIN_SAMPLES:
        return {"enough_data": False, "n_live": len(live), "features": {}, "drift": False,
                "drifted_features": []}
    features, drifted = {}, []
    for col in FEATURES:
        stat, p = ks_2samp(reference[col], live[col])
        flag = bool(p < DRIFT_P_VALUE and stat >= DRIFT_MIN_KS)
        features[col] = {"ks": round(float(stat), 4), "p_value": float(p), "drift": flag}
        if flag:
            drifted.append(col)
    return {"enough_data": True, "n_live": len(live), "features": features,
            "drift": len(drifted) >= DRIFT_MIN_FEATURES, "drifted_features": drifted}


if __name__ == "__main__":
    ref = pd.read_csv("data/reference.csv")
    live = pd.read_json(sys.argv[1], lines=True)
    report = drift_report(ref, live)
    print(json.dumps(report, indent=2))
    if report["drift"]:
        print("DRIFT DETECTED:", report["drifted_features"])
        sys.exit(2)
