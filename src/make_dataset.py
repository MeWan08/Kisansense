"""Generate a synthetic stand-in for the Kaggle 'Crop Recommendation' dataset.

Why this exists: it lets the whole pipeline (DVC, CI, Docker, Kubernetes) run on a
fresh clone without a Kaggle login. The class profiles below are rough averages of
the public dataset, with Gaussian noise. For your final submission, download the real
CSV from Kaggle and drop it at data/raw/Crop_recommendation.csv instead.

Usage: python src/make_dataset.py [output_path]
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd

from config import FEATURES, RANGES

# crop: N, P, K, temperature, humidity, ph, rainfall (class means)
PROFILES = {
    "rice": (80, 48, 40, 23.7, 82, 6.4, 236),
    "maize": (78, 48, 20, 22.4, 65, 6.2, 85),
    "chickpea": (40, 68, 80, 18.9, 17, 7.3, 80),
    "kidneybeans": (21, 68, 20, 20.0, 22, 5.8, 106),
    "pigeonpeas": (21, 68, 20, 27.7, 48, 5.8, 149),
    "mothbeans": (21, 48, 20, 28.2, 53, 6.8, 51),
    "mungbean": (21, 48, 20, 28.5, 85, 6.7, 48),
    "blackgram": (40, 67, 19, 30.0, 65, 7.1, 68),
    "lentil": (19, 68, 19, 24.5, 64, 6.9, 46),
    "pomegranate": (19, 19, 40, 21.8, 90, 6.4, 108),
    "banana": (100, 82, 50, 27.4, 80, 6.0, 105),
    "mango": (20, 27, 30, 31.2, 50, 5.8, 94),
    "grapes": (23, 132, 200, 23.8, 82, 6.0, 70),
    "watermelon": (99, 17, 50, 25.6, 85, 6.5, 50),
    "muskmelon": (100, 17, 50, 28.7, 92, 6.4, 25),
    "apple": (21, 134, 200, 22.6, 92, 5.9, 113),
    "orange": (20, 16, 10, 22.8, 92, 7.0, 110),
    "papaya": (50, 59, 50, 33.7, 92, 6.7, 143),
    "coconut": (22, 17, 31, 27.4, 95, 6.0, 176),
    "cotton": (118, 46, 20, 24.0, 80, 6.9, 80),
    "jute": (78, 47, 40, 25.0, 80, 6.7, 175),
    "coffee": (101, 29, 30, 25.5, 58, 6.8, 158),
}
# per-feature noise (rainfall noise is scaled to the class mean below)
STD = {"N": 6, "P": 4.8, "K": 4.8, "temperature": 1.2, "humidity": 3.6, "ph": 0.24}


def build(per_class: int = 100, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = []
    for crop, means in PROFILES.items():
        data = {}
        for f, m in zip(FEATURES, means):
            std = max(8.0, 0.15 * m) if f == "rainfall" else STD[f]
            lo, hi = RANGES[f]
            data[f] = np.clip(rng.normal(m, std, per_class), lo, hi)
        df = pd.DataFrame(data)
        df["label"] = crop
        rows.append(df)
    out = pd.concat(rows, ignore_index=True).sample(frac=1, random_state=seed)
    return out.round(2).reset_index(drop=True)


if __name__ == "__main__":
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "data/raw/Crop_recommendation.csv")
    path.parent.mkdir(parents=True, exist_ok=True)
    build().to_csv(path, index=False)
    print(f"wrote {path}")
