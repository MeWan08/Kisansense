"""Quality gate. Fails the build when the freshly trained model is not good enough.

Checks metrics.json against params.yaml thresholds:
  - macro F1 must be at least train.min_f1
  - the F1 gap between rainfall bands must be at most train.max_regional_gap

Usage: python src/gate.py
"""
import json
import sys

import yaml

params = yaml.safe_load(open("params.yaml"))["train"]
metrics = json.load(open("metrics.json"))

failures = []
if metrics["macro_f1"] < params["min_f1"]:
    failures.append(f"macro_f1 {metrics['macro_f1']} < {params['min_f1']}")
if metrics["regional_gap"] > params["max_regional_gap"]:
    failures.append(f"regional_gap {metrics['regional_gap']} > {params['max_regional_gap']}")

if failures:
    print("QUALITY GATE FAILED")
    print("\n".join(f" - {f}" for f in failures))
    sys.exit(1)
print(f"quality gate passed (macro_f1={metrics['macro_f1']}, gap={metrics['regional_gap']})")
