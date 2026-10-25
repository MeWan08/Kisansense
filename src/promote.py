"""Promote the 'challenger' model version to 'champion' in the MLflow registry.

Rules, in order:
  1. The challenger must clear the quality gate floor (train.min_f1 in params.yaml).
  2. If a champion exists, the challenger must match or beat it on the SAME test set.
     train.py scores the champion on the new test split and logs it as champion_f1_same_test.
     Comparing F1 across different test sets would be meaningless after the data changes.

The previous champion stays registered, so rolling back is one alias move:
  python src/promote.py --rollback <version>

Exit code 3 means "not promoted".
"""
import os
import sys

import mlflow
import yaml

NAME = "kisansense-classifier"
mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "sqlite:///mlflow.db"))
client = mlflow.MlflowClient()

if "--rollback" in sys.argv:
    target = sys.argv[sys.argv.index("--rollback") + 1]
    client.set_registered_model_alias(NAME, "champion", target)
    print(f"champion alias moved to version {target}")
    sys.exit(0)

challenger = client.get_model_version_by_alias(NAME, "challenger")
metrics = client.get_run(challenger.run_id).data.metrics
f1 = metrics["macro_f1"]
with open("params.yaml") as fh:
    min_f1 = yaml.safe_load(fh)["train"]["min_f1"]

if f1 < min_f1:
    print(f"refused: challenger f1 {f1} is below the gate ({min_f1})")
    sys.exit(3)

champ_f1 = metrics.get("champion_f1_same_test")
if champ_f1 is None or f1 >= champ_f1:
    client.set_registered_model_alias(NAME, "champion", challenger.version)
    print(f"promoted version {challenger.version} to champion "
          f"(f1 {f1} vs current champion {champ_f1 if champ_f1 is not None else 'none'} "
          f"on the same test set)")
else:
    print(f"kept current champion: challenger f1 {f1} < champion {champ_f1} on the same test set")
    sys.exit(3)
