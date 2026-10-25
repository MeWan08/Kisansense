"""Data validation gate. Exits non-zero when the dataset breaks the contract,
so DVC and CI stop before a bad dataset reaches training.

Usage: python src/validate.py data/raw/Crop_recommendation.csv
"""
import sys

import pandas as pd

from config import FEATURES, RANGES

MIN_PER_CLASS = 30


def validate(df: pd.DataFrame) -> list:
    errors = []
    for col in FEATURES:
        if col not in df:
            errors.append(f"missing column: {col}")
            continue
        if df[col].isna().any():
            errors.append(f"{int(df[col].isna().sum())} null values in {col}")
        lo, hi = RANGES[col]
        bad = int(((df[col] < lo) | (df[col] > hi)).sum())
        if bad:
            errors.append(f"{bad} values of {col} outside [{lo}, {hi}]")
    if "label" not in df:
        errors.append("missing column: label")
    else:
        counts = df["label"].value_counts()
        small = counts[counts < MIN_PER_CLASS]
        if len(small):
            errors.append(f"classes with fewer than {MIN_PER_CLASS} rows: {list(small.index)}")
    if df.duplicated().sum() > 0.05 * len(df):
        errors.append("more than 5% duplicate rows")
    return errors


if __name__ == "__main__":
    errs = validate(pd.read_csv(sys.argv[1]))
    if errs:
        print("VALIDATION FAILED")
        print("\n".join(f" - {e}" for e in errs))
        sys.exit(1)
    print("data ok")
