from make_dataset import build
from validate import validate


def test_clean_data_passes():
    assert validate(build(per_class=40)) == []


def test_out_of_range_caught():
    df = build(per_class=40)
    df.loc[0, "ph"] = 14
    assert any("ph" in e for e in validate(df))


def test_nulls_caught():
    df = build(per_class=40)
    df.loc[0, "N"] = None
    assert any("null" in e for e in validate(df))


def test_missing_column_caught():
    df = build(per_class=40).drop(columns=["rainfall"])
    assert any("rainfall" in e for e in validate(df))


def test_rare_class_caught():
    import pandas as pd

    df = build(per_class=40)
    keep = pd.concat([df[df["label"] != "rice"], df[df["label"] == "rice"].head(5)])
    assert any("fewer than" in e for e in validate(keep))
