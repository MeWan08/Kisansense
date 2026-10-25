FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

# dependencies first, so this layer is cached until requirements change
COPY requirements-serve.txt .
RUN pip install --no-cache-dir -r requirements-serve.txt

# code and the trained model. model.joblib and data/reference.csv come from `dvc repro`
COPY src/ src/
COPY model.joblib .
COPY data/reference.csv data/reference.csv

# the version string reported by /health and in every log line
ARG MODEL_VERSION=dev
ENV MODEL_VERSION=${MODEL_VERSION}

RUN useradd --system --uid 10001 appuser
USER 10001

EXPOSE 8080
# one worker + threads keeps the in-memory drift window and metrics consistent;
# scale out with more pods (see k8s/hpa.yaml)
CMD ["gunicorn", "--workers", "1", "--threads", "4", "--bind", "0.0.0.0:8080", "--pythonpath", "src", "--access-logfile", "-", "app:app"]
