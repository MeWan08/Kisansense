import pandas as pd

from config import FEATURES
from drift import drift_report
from make_dataset import build


def _split():
    df = build(per_class=100)[FEATURES]
    return df.iloc[:1100].reset_index(drop=True), df.iloc[1100:].reset_index(drop=True)


def test_no_drift_on_same_distribution():
    ref, live = _split()
    report = drift_report(ref, live)
    assert report["enough_data"]
    assert report["drift"] is False


def test_detects_climate_shift():
    ref, live = _split()
    live = live.copy()
    live["temperature"] = live["temperature"] + 4
    live["rainfall"] = live["rainfall"] * 0.7
    report = drift_report(ref, live)
    assert report["drift"] is True
    assert {"temperature", "rainfall"} <= set(report["drifted_features"])


def test_waits_for_enough_samples():
    ref, live = _split()
    report = drift_report(ref, live.head(10))
    assert report["enough_data"] is False
    assert report["drift"] is False


def test_single_feature_shift_is_not_enough_to_alert():
    ref, live = _split()
    live = live.copy()
    live["temperature"] = live["temperature"] + 4
    assert drift_report(ref, pd.DataFrame(live))["drift"] is False
