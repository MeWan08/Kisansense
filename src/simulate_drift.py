"""Send synthetic traffic to a running API, with or without a climate shift.

'normal' replays training-like data. 'drift' warms temperature by 4 degrees and cuts
rainfall by 30 percent, the kind of change a hotter, drier season produces.

Usage:
  python src/simulate_drift.py http://localhost:8080 normal
  python src/simulate_drift.py http://localhost:8080 drift
"""
import os
import sys

import pandas as pd
import requests

from config import RANGES

base, mode = sys.argv[1].rstrip("/"), sys.argv[2]
# On Windows "localhost" resolves to IPv6 ::1 first; against an IPv4-only server every request
# then stalls about 2 seconds before falling back. 127.0.0.1 avoids that.
base = base.replace("://localhost", "://127.0.0.1")
n = int(sys.argv[3]) if len(sys.argv) > 3 else 400
key = os.getenv("API_KEY", "dev-key")

df = pd.read_csv("data/reference.csv").sample(n, random_state=7, replace=True)
if mode == "drift":
    df["temperature"] = (df["temperature"] + 4).clip(upper=RANGES["temperature"][1])
    df["rainfall"] = (df["rainfall"] * 0.7).clip(lower=RANGES["rainfall"][0])

ok = 0
with requests.Session() as session:      # reuse connections, much faster than one per request
    session.headers["x-api-key"] = key
    for _, row in df.iterrows():
        r = session.post(f"{base}/predict", json=row.to_dict(), timeout=5)
        ok += r.status_code == 200
print(f"sent {n} requests ({mode}), {ok} succeeded")
print(f"now check: curl {base}/drift")
