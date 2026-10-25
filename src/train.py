"""Train the crop classifier, track it in MLflow, register a new model version.

Outputs (consumed by DVC, CI and Docker):
  model.joblib         the model the API serves
  data/reference.csv   training features, the baseline for drift detection
  metrics.json         headline metrics, read by the CI quality gate

MLflow location comes from MLFLOW_TRACKING_URI (default: local sqlite file).
"""
import hashlib
import json
import os
import subprocess
from pathlib import Path

import joblib
import mlflow
import mlflow.sklearn
import pandas as pd
import yaml
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split

from config import FEATURES

DATA = Path(os.getenv("DATA_PATH", "data/raw/Crop_recommendation.csv"))
MODEL_NAME = "kisansense-classifier"


def git_sha() -> str:
    if os.getenv("GITHUB_SHA"):
        return os.environ["GITHUB_SHA"][:8]
    try:
        return subprocess.check_output(["git", "rev-parse", "--short=8", "HEAD"],
                                       stderr=subprocess.DEVNULL, text=True).strip()
    except Exception:
        return "unknown"


def file_md5(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def regional_f1(Xte: pd.DataFrame, yte: pd.Series, pred) -> dict:
    """Fairness check. Rainfall tercile is a rough proxy for agro-climatic region."""
    bands = pd.qcut(Xte["rainfall"], 3, labels=["low_rain", "mid_rain", "high_rain"])
    out = {}
    for band in ["low_rain", "mid_rain", "high_rain"]:
        mask = (bands == band).to_numpy()
        out[band] = round(float(f1_score(yte[mask], pred[mask], average="macro")), 4)
    return out


def champion_f1_on(Xte: pd.DataFrame, yte: pd.Series):
    """Score the current champion on THIS test set, so promote.py compares like with like.
    Returns None when no champion exists yet. Caveat: rows of an older training set can sit in
    this test split, which flatters the champion slightly. That makes promotion conservative."""
    try:
        champ = mlflow.sklearn.load_model(f"models:/{MODEL_NAME}@champion")
    except mlflow.exceptions.MlflowException:
        return None
    return round(float(f1_score(yte, champ.predict(Xte), average="macro")), 4)


def main() -> None:
    params = yaml.safe_load(open("params.yaml"))["train"]
    mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "sqlite:///mlflow.db"))
    mlflow.set_experiment("kisansense")

    df = pd.read_csv(DATA)
    X, y = df[FEATURES], df["label"]
    Xtr, Xte, ytr, yte = train_test_split(
        X, y, test_size=params["test_size"], stratify=y, random_state=params["seed"])

    with mlflow.start_run() as run:
        model = RandomForestClassifier(
            n_estimators=params["n_estimators"],
            max_depth=params["max_depth"],
            random_state=params["seed"],
            n_jobs=-1,
        ).fit(Xtr, ytr)
        pred = model.predict(Xte)

        metrics = {
            "macro_f1": round(float(f1_score(yte, pred, average="macro")), 4),
            "accuracy": round(float(accuracy_score(yte, pred)), 4),
        }
        regional = regional_f1(Xte, yte, pred)
        metrics["regional_f1"] = regional
        metrics["regional_gap"] = round(max(regional.values()) - min(regional.values()), 4)

        champ_f1 = champion_f1_on(Xte, yte)
        if champ_f1 is not None:
            metrics["champion_f1_same_test"] = champ_f1

        mlflow.log_params({k: v for k, v in params.items()})
        mlflow.log_metrics({"macro_f1": metrics["macro_f1"], "accuracy": metrics["accuracy"],
                            "regional_gap": metrics["regional_gap"]})
        if champ_f1 is not None:
            mlflow.log_metric("champion_f1_same_test", champ_f1)
        # lineage tags: which code and which data produced this model
        mlflow.set_tags({"git_sha": git_sha(), "data_md5": file_md5(DATA),
                         "n_train_rows": str(len(Xtr))})

        Xtr.to_csv("data/reference.csv", index=False)
        joblib.dump(model, "model.joblib")
        mlflow.log_artifact("data/reference.csv")
        # MLflow 3 defaults to skops, which rejects tree models unless every type is
        # allow-listed. cloudpickle is fine here because we load only models we trained.
        info = mlflow.sklearn.log_model(model, name="model", registered_model_name=MODEL_NAME,
                                        serialization_format="cloudpickle")
        metrics["mlflow_run_id"] = run.info.run_id
        metrics["model_uri"] = info.model_uri

    # new versions start as "challenger"; promote.py moves "champion" if the gate passes
    client = mlflow.MlflowClient()
    versions = client.search_model_versions(f"name='{MODEL_NAME}'")
    latest = max(versions, key=lambda v: int(v.version))
    client.set_registered_model_alias(MODEL_NAME, "challenger", latest.version)
    metrics["model_version"] = latest.version

    Path("metrics.json").write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
