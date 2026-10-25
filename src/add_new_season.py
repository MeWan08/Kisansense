"""Simulate a newly labelled season after a climate shift, to demonstrate data versioning
and retraining. Appends rows drawn from the shifted conditions (temperature +4,
rainfall x0.7) to the raw CSV. Then you version the new data and retrain:

  python src/add_new_season.py
  dvc add data/raw/Crop_recommendation.csv     # new data hash
  dvc repro                                   # retrains, gate decides
  git add data/raw/*.dvc dvc.lock metrics.json && git commit -m "data: new season"

In real life these rows come from farmers' confirmed outcomes, not a simulator.
"""
import sys

import pandas as pd

from config import RANGES
from make_dataset import build

path = "data/raw/Crop_recommendation.csv"
per_class = int(sys.argv[1]) if len(sys.argv) > 1 else 50

old = pd.read_csv(path)
new = build(per_class=per_class, seed=2026 + len(old))
new["temperature"] = (new["temperature"] + 4).clip(upper=RANGES["temperature"][1])
new["rainfall"] = (new["rainfall"] * 0.7).clip(lower=RANGES["rainfall"][0])

pd.concat([old, new], ignore_index=True).to_csv(path, index=False)
print(f"appended {len(new)} shifted rows, dataset now {len(old) + len(new)} rows")
