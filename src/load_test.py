"""Concurrent load generator, a cross-platform stand-in for `hey` (handy on Windows).

Usage: python src/load_test.py http://127.0.0.1:30080 120 40
       (base url, duration in seconds, concurrent workers)
"""
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import requests

base = sys.argv[1].rstrip("/").replace("://localhost", "://127.0.0.1")
duration = float(sys.argv[2]) if len(sys.argv) > 2 else 60
workers = int(sys.argv[3]) if len(sys.argv) > 3 else 20
key = os.getenv("API_KEY", "change-me")
BODY = {"N": 90, "P": 42, "K": 43, "temperature": 21, "humidity": 82, "ph": 6.5, "rainfall": 203}

counts = {"ok": 0, "fail": 0}
lock = threading.Lock()
stop_at = time.time() + duration


def worker():
    with requests.Session() as s:
        s.headers["x-api-key"] = key
        while time.time() < stop_at:
            try:
                ok = s.post(f"{base}/predict", json=BODY, timeout=10).status_code == 200
            except requests.RequestException:
                ok = False
            with lock:
                counts["ok" if ok else "fail"] += 1


print(f"load: {workers} workers for {duration:.0f}s against {base}")
with ThreadPoolExecutor(workers) as pool:
    for _ in range(workers):
        pool.submit(worker)
    while time.time() < stop_at:
        time.sleep(10)
        print(f"  ok={counts['ok']} fail={counts['fail']}")
print(f"done: ok={counts['ok']} fail={counts['fail']} ({counts['ok'] / duration:.1f} req/s)")
