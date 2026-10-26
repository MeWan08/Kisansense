# 🌾 KisanSense: End-to-End Precision Agronomy & MLOps Platform

## Executive Summary

**KisanSense** is an enterprise-grade, production-ready Machine Learning system engineered to optimize crop selection based on granular soil chemistry and localized climatic conditions. By transforming complex agronomic data into actionable, high-confidence crop recommendations, KisanSense bridges the gap between agricultural science and field-level decision-making for farmers, agricultural consultants, and policy planners.

Unlike static ML demonstrations, KisanSense is designed and deployed as a **continuous, observable production system**. It incorporates automated data validation, strict quality and regional fairness gates, experiment tracking and model registry governance, statistical data drift telemetry on live production traffic, Prometheus/Grafana observability, and a fully automated continuous deployment (CD) pipeline to cloud infrastructure on AWS.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Data Versioning & Pipeline** | DVC (Data Version Control), Pandas, NumPy |
| **Model Development & Governance** | Scikit-learn (Random Forest Classifier), MLflow Model Registry |
| **Data Drift Detection** | SciPy (Two-Sample Kolmogorov-Smirnov Test), In-Memory Rolling Windows |
| **Inference Serving & API** | Python Flask, Gunicorn (WSGI multi-threaded), Flask-CORS |
| **Frontend Application** | React 19, TypeScript, Tailwind CSS, Lucide Icons, i18next (EN, HI, MR) |
| **Monitoring & Observability** | Prometheus (metrics scraper), Grafana (visualization dashboards) |
| **Containerization & Orchestration** | Docker, Docker Compose, OCI Multi-stage Builds |
| **CI / CD Automation** | GitHub Actions, GitOps push-based triggers, AWS CLI, SSH Deploy |
| **Cloud Infrastructure (IaaS)** | AWS EC2 (Amazon Linux), AWS ECR (Private Registry), DuckDNS |

---

## 📊 The Dataset & Problem Definition

The foundational dataset comprises **2,200 agricultural observations** across 22 distinct crop categories (100 balanced records per crop).

### Features:
1. **Soil Nutrients**:
   - `N` (Nitrogen): $0 - 140\text{ kg/ha}$
   - `P` (Phosphorus): $5 - 145\text{ kg/ha}$
   - `K` (Potassium): $5 - 205\text{ kg/ha}$
   - `ph`: Soil acidity / alkalinity scale ($3.5 - 9.9$)
2. **Environmental & Climatic Conditions**:
   - `temperature`: Ambient temperature in Celsius ($8.8^\circ\text{C} - 43.7^\circ\text{C}$)
   - `humidity`: Relative atmospheric humidity ($14.2\% - 99.9\%$)
   - `rainfall`: Precipitation level in millimeters ($20.2 - 298.6\text{ mm}$)

### Target Label:
- One of **22 crop varieties**:
  - *Cereals & Pulses*: Rice, Maize, Chickpea, Kidney Beans, Pigeon Peas, Moth Beans, Mung Bean, Black Gram, Lentil.
  - *Fruits*: Banana, Mango, Grapes, Watermelon, Muskmelon, Apple, Orange, Papaya, Pomegranate, Coconut.
  - *Cash & Industrial Crops*: Cotton, Jute, Coffee.

---

## 🔄 End-to-End System & MLOps Pipeline Architecture

```mermaid
graph TD
    subgraph "1. Data Engineering & Versioning"
        RawData[Raw Agricultural Data] --> DVC[DVC Tracked Store]
        DVC --> Validate[src/validate.py<br/>Schema & Range Validation]
        Validate --> BaselineRef[Generate data/reference.csv]
    end

    subgraph "2. Training & Quality Gate Governance"
        Validate --> Train[src/train.py<br/>Random Forest Training]
        Train --> MLflowExp[MLflow Experiment Tracking<br/>Params, Metrics, Artifacts]
        Train --> GateCheck[src/gate.py<br/>Quality & Fairness Gate]
        GateCheck -->|Pass: F1 >= 0.95 & Gap <= 0.10| Promote[src/promote.py<br/>Promote Challenger to Champion]
        GateCheck -->|Fail| Abort[Block Release]
    end

    subgraph "3. Automated CI/CD (GitHub Actions)"
        Promote --> PushMain[Merge PR to main]
        PushMain --> CIWorkflow[ci.yml: Lint, Test, Gate]
        PushMain --> CDWorkflow[cd.yml: Container Pipeline]
        CDWorkflow --> BuildBackend[Build API Docker Image]
        CDWorkflow --> BuildFrontend[Build Vite/React UI Image]
        BuildBackend --> ECR[(AWS ECR Repository)]
        BuildFrontend --> ECR
    end

    subgraph "4. Production Infrastructure (AWS EC2)"
        CDWorkflow -->|SSH Trigger| EC2[EC2 t3.micro Host]
        ECR -->|Pull Images| EC2
        EC2 --> DockerCompose[Docker Compose Prod Stack]
        DockerCompose --> UIContainer[Nginx Web Server :80<br/>React TypeScript SPA]
        DockerCompose --> APIContainer[Gunicorn API :8080<br/>Model Serving]
        DockerCompose --> PromContainer[Prometheus :9090]
        DockerCompose --> GrafContainer[Grafana :3000]
    end

    subgraph "5. Live Production Drift Detection & Telemetry"
        UserReq[Client / Farmer Request] --> UIContainer
        UIContainer -->|REST POST /predict| APIContainer
        APIContainer --> InferenceEngine[Model Inference]
        InferenceEngine --> TopPred[Top Crop + Top 3 Confidence]
        APIContainer --> DriftBuffer[In-Memory Rolling Window<br/>Recent N Observations]
        BaselineRef -.->|Reference Baseline| DriftBuffer
        DriftBuffer --> KSTest[Two-Sample KS Test<br/>Per Feature p-values]
        APIContainer --> PromMetrics[/metrics Endpoint]
        PromContainer -->|Scrapes every 15s| PromMetrics
        GrafContainer -->|Visualizes| PromContainer
    end
```

---

## 🔬 Pipeline Stage Breakdown

### Stage 1: Data Governance & Lineage (DVC)
* Raw datasets are tracked using `data/raw/Crop_recommendation.csv.dvc`, keeping heavy data files out of Git.
* `src/validate.py` executes strict boundary validation (null checks, numeric ranges, categorical integrity).
* Generates a frozen `data/reference.csv` distribution snapshot used as the statistical baseline for production drift comparison.

### Stage 2: Model Training & Evaluation
* **Algorithm**: Random Forest Classifier with calibrated tree depth and balanced class estimators.
* **Performance Metrics**:
  * **Accuracy**: **96.97%**
  * **Macro F1-Score**: **0.9696**
  * **Regional Fairness Gap**: **0.0301** (well within the $\le 0.10$ threshold).

### Stage 3: MLflow Registry & Quality Gating
* Every run logs parameters, metrics (`accuracy`, `macro_f1`, `regional_fairness_gap`), and serialized `model.joblib`.
* `src/gate.py` asserts:
  1. $\text{Macro F1} \ge 0.95$
  2. $\text{Regional Fairness Gap} \le 0.10$
* `src/promote.py` queries the SQLite MLflow registry (`mlflow.db`) and automatically transitions the model to the **`champion`** alias only if it outperforms the incumbent champion on identical test distributions.

### Stage 4: Real-Time Serving & Live Drift Monitoring
* **Gunicorn / Flask Serving Layer**: Multi-threaded WSGI runtime exposing:
  * `POST /predict`: Accepts `{N, P, K, temperature, humidity, ph, rainfall}` with API-Key authentication. Returns recommended crop, confidence, alternative candidates, and latency metadata.
  * `GET /drift`: Performs a **Two-Sample Kolmogorov-Smirnov (KS) test** across all 7 features by comparing the live sliding observation buffer against `data/reference.csv`. If $p\text{-value} < 0.05$, a feature is flagged as drifted.
  * `GET /metrics`: Standard Prometheus format exposing prediction counts, latency histograms, and drift status flags.
  * `GET /health`: Model version and readiness healthcheck.

### Stage 5: Frontend Experience & Accessibility
* Modern **React 19 + TypeScript + Tailwind CSS** single-page application.
* **Key Features**:
  * Dual input controls: Slider controls and precision numeric inputs.
  * Presets for standard agro-ecological zones (e.g. *Rice Field*, *Cotton Belt*, *Coffee Plantation*).
  * Multilingual localization via `i18next`: **English**, **Hindi (हिन्दी)**, and **Marathi (मराठी)**.
  * Live drift pill that queries `/drift` to notify users when climatic shifts make inferences less reliable.
  * Full accessibility: Tested contrast ratios (WCAG AA), screen-reader semantics, and keyboard navigation.

### Stage 6: Automated CI/CD & Cloud Infrastructure
* **AWS Cloud Setup**:
  * **AWS ECR**: Immutable Docker registries (`kisansense` and `kisansense-frontend`) tagging images with Git SHA and `:latest`.
  * **AWS EC2 (`t3.micro`)**: Budget-optimized IaaS running Docker Engine and Compose.
  * **Zero-Intervention CD**: On push/merge to `main`, GitHub Actions builds both containers, pushes to ECR, establishes SSH to EC2, provisions `.env`, pulls updated layers, and executes an in-place zero-downtime service restart with automated curl health verification.

---

## 🎯 UN Sustainable Development Goal (SDG) Alignment

1. **SDG 2: Zero Hunger (Targets 2.3 & 2.4)**
   * Empowers smallholder and regional farmers with precision agronomy advice to maximize crop yield per hectare, reducing crop failure risks through scientifically matched soil-crop alignment.
2. **SDG 12: Responsible Consumption and Production (Target 12.2)**
   * Prevents soil acidification and nutrient leaching by curtailing excessive synthetic Nitrogen, Phosphorus, and Potassium (NPK) application through crop-specific recommendations.
3. **SDG 13: Climate Action (Target 13.1)**
   * Integrates live continuous KS data drift detection, alerting agricultural stakeholders when shifting weather patterns (temperature spikes, altered monsoon rainfall) invalidate historical planting choices.
4. **SDG 9: Industry, Innovation, and Infrastructure (Target 9.c)**
   * Delivers accessible, low-latency, multilingual digital infrastructure that democratizes AI tools for farmers in their local vernacular languages.
