H = {"x-api-key": "test-key"}
GOOD = {"N": 90, "P": 42, "K": 43, "temperature": 21, "humidity": 82, "ph": 6.5, "rainfall": 203}


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_rejects_missing_key(client):
    assert client.post("/predict", json=GOOD).status_code == 401


def test_rejects_missing_field(client):
    bad = {k: v for k, v in GOOD.items() if k != "ph"}
    assert client.post("/predict", headers=H, json=bad).status_code == 400


def test_rejects_out_of_range(client):
    bad = dict(GOOD, temperature=99)
    assert client.post("/predict", headers=H, json=bad).status_code == 422


def test_returns_three_ranked_crops(client):
    r = client.post("/predict", headers=H, json=GOOD)
    assert r.status_code == 200
    recs = r.get_json()["recommendations"]
    assert len(recs) == 3
    confs = [x["confidence"] for x in recs]
    assert confs == sorted(confs, reverse=True)


def test_metrics_exposed(client):
    client.post("/predict", headers=H, json=GOOD)
    body = client.get("/metrics").get_data(as_text=True)
    assert "predict_latency_seconds" in body
    assert "drift_detected" in body


def test_drift_endpoint_reports_not_enough_data_at_first(client):
    r = client.get("/drift")
    assert r.status_code == 200
    assert "drift" in r.get_json()


def test_model_info(client):
    r = client.get("/model-info")
    assert r.status_code == 200
    body = r.get_json()
    assert "model_version" in body
    assert "accuracy" in body
    assert "macro_f1" in body
    assert body["accuracy"] > 0.90
    assert body["macro_f1"] > 0.90

