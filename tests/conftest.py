"""Test fixtures. Builds a small model in a temp dir so API tests do not depend on
the real pipeline having run."""
import os
import sys
from pathlib import Path

import joblib
import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))


@pytest.fixture(scope="session")
def artifacts(tmp_path_factory):
    from sklearn.ensemble import RandomForestClassifier

    from config import FEATURES
    from make_dataset import build

    d = tmp_path_factory.mktemp("art")
    df = build(per_class=60)
    model = RandomForestClassifier(n_estimators=30, random_state=0).fit(df[FEATURES], df["label"])
    joblib.dump(model, d / "model.joblib")
    df[FEATURES].to_csv(d / "reference.csv", index=False)
    return d


@pytest.fixture(scope="session")
def client(artifacts):
    os.environ["MODEL_PATH"] = str(artifacts / "model.joblib")
    os.environ["REFERENCE_PATH"] = str(artifacts / "reference.csv")
    os.environ["API_KEY"] = "test-key"
    import app as app_module

    app_module.app.config["TESTING"] = True
    return app_module.app.test_client()
