.PHONY: data validate train test lint run docker up drift-demo clean

export MLFLOW_DISABLE_TELEMETRY=true

data:
	python src/make_dataset.py

validate:
	python src/validate.py data/raw/Crop_recommendation.csv

train:
	python src/train.py && python src/gate.py && python src/promote.py

test:
	pytest -q

lint:
	ruff check src tests

run:
	API_KEY=dev-key MODEL_VERSION=local gunicorn -w 1 --threads 4 -b 0.0.0.0:8080 --pythonpath src app:app

docker:
	docker build --build-arg MODEL_VERSION=local -t kisansense:v1 .

up:
	docker compose up --build

drift-demo:
	python src/simulate_drift.py http://localhost:8080 normal 300
	curl -s localhost:8080/drift | python -m json.tool | head -5
	python src/simulate_drift.py http://localhost:8080 drift 500
	curl -s localhost:8080/drift | python -m json.tool | head -5

clean:
	rm -rf mlflow.db mlruns mlartifacts model.joblib metrics.json data/reference.csv logs .pytest_cache
