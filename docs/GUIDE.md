# KisanSense implementation guide

This guide takes you from an empty folder to a deployed, monitored, retrainable ML service.
Work through it in order. Each part ends with something you can screenshot for your report.

What was tested where: parts 2 to 5 and 11 were run end to end in a sandbox (data, DVC, MLflow,
gate, promote, API, drift). Parts 6 to 10 (Docker, AWS, Kubernetes, monitoring stack, GitHub
Actions) are written from the configs in this repo but could not be run in the sandbox, because it
had no Docker daemon, cluster or AWS account. Expect to fix small things there, and see part 14.

## How the pieces fit

```
 data/raw CSV --dvc add--> S3 (DVC remote)            Git: code, params, dvc.lock, k8s, workflows
      |
      v
 validate.py --> train.py --> gate.py --> promote.py          dvc repro runs these in order
      |            |                          |
      |            +--> MLflow: params, metrics, lineage tags, model versions
      |                                       +--> registry aliases: challenger, champion
      v
 GitHub Actions: lint, tests, train, gate, promote, build image (tag = git sha), push to ECR
      |
      v
 Kubernetes: Deployment (rolling update), Service, HPA, optional canary
      |
 Flask API: /predict /health /drift /metrics + JSON logs on stdout
      |                         |
      |                         +--> Prometheus --> Grafana dashboard, alert rules
      +--> rolling window of recent inputs --> KS drift test --> drift_detected gauge
                                                         |
                          alert --> retrain workflow --> new champion --> new image --> rollout
```

Three kinds of versioning, and which tool owns each:

| What changes | Tool | Where you see it |
|---|---|---|
| Code, config, pipeline definition | Git | commit SHA |
| Datasets and trained files | DVC | hash in `*.dvc` and `dvc.lock`, bytes in the S3 remote |
| Model versions, metrics, lineage | MLflow registry | version number, aliases, run page |

The image tag equals the Git SHA, and MLflow runs carry `git_sha` and `data_md5` tags, so any
prediction can be traced back to the code, data and parameters that produced the model.

---

## 1. Prerequisites

Install: Python 3.13 (3.11 or newer works, pins were tested on 3.13), Git, Docker Desktop, `kubectl`,
`kind`, `helm`, AWS CLI v2, and optionally `hey` (load testing) and `jq` (reading JSON logs).

Accounts: GitHub, AWS (free tier is enough for most steps).

Set an AWS Budget alert of 5 USD before you create anything. Console, Billing, Budgets.

---

## 2. Project setup and Git

```bash
cd kisansense
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

git init -b main
git add -A
git commit -m "initial project"
```

Create an empty GitHub repository, then:

```bash
git remote add origin git@github.com:<you>/kisansense.git
git push -u origin main
```

Workflow that earns marks in a viva: work on a branch, open a pull request, let CI run, merge.

```bash
git checkout -b feat/tighten-validation
# edit, commit
git push -u origin feat/tighten-validation   # then open a PR on GitHub
```

In GitHub, Settings, Branches, add a rule for `main` that requires the `build-test` check to pass.
Now a failing quality gate physically blocks a merge. Screenshot that.

---

## 3. Data versioning with DVC

### 3.1 Get data

Quick start: `python src/make_dataset.py` writes a synthetic stand-in.

For your submission, download the real Kaggle "Crop Recommendation Dataset" and save it as
`data/raw/Crop_recommendation.csv`. Column names must be `N, P, K, temperature, humidity, ph,
rainfall, label`. Then run `python src/validate.py data/raw/Crop_recommendation.csv`. If the real
file trips a range check, widen the range in `src/config.py` after looking at the data. Do not
silence the check without looking.

### 3.2 Initialise DVC with a local remote first

```bash
dvc init
dvc remote add -d localstore ../kisansense-dvc-store     # any folder outside the repo
dvc add data/raw/Crop_recommendation.csv
git add .dvc data/raw/Crop_recommendation.csv.dvc data/raw/.gitignore .dvcignore
git commit -m "track raw data with dvc"
dvc push
```

What happened: DVC moved the file into its cache, replaced it with a pointer
(`Crop_recommendation.csv.dvc`, containing an MD5), and told Git to ignore the real file. Git now
stores a 100-byte pointer, and the remote stores the data.

### 3.3 Switch the remote to S3

```bash
aws configure                                           # access key, secret, region ap-south-1
aws s3 mb s3://kisansense-<yourname>-data --region ap-south-1
aws s3api put-bucket-versioning --bucket kisansense-<yourname>-data \
    --versioning-configuration Status=Enabled
dvc remote add -d s3store s3://kisansense-<yourname>-data/dvc
dvc remote default s3store
dvc push
git add .dvc/config && git commit -m "dvc: use s3 remote"
```

`.dvc/config` holds the bucket URL, not credentials. CI gets credentials from GitHub secrets.

### 3.4 Run the pipeline

```bash
dvc repro            # validate -> train -> gate; skips stages whose inputs did not change
dvc metrics show
dvc dag
git add dvc.lock metrics.json && git commit -m "first trained model"
```

`dvc repro` is the reproducibility proof for your report: same data hash plus same `params.yaml`
gives the same model.

### 3.5 Create a second data version, then travel back in time

```bash
python src/add_new_season.py 50            # appends shifted, newly labelled rows
dvc add data/raw/Crop_recommendation.csv   # new hash
dvc repro                                  # retrains on the new data; gate decides
git add data/raw/Crop_recommendation.csv.dvc dvc.lock metrics.json
git commit -m "data: new season"
dvc push

# later: reproduce the exact old state
git checkout <old-commit> -- data/raw/Crop_recommendation.csv.dvc dvc.lock
dvc checkout
```

Screenshot `git log` next to `dvc metrics diff HEAD~1`. That is data versioning in one picture.

---

## 4. Experiment tracking and model versioning with MLflow

`train.py` already does the work. Each run logs parameters, macro F1, accuracy, the regional F1 gap,
the reference dataset, and tags `git_sha`, `data_md5`, `n_train_rows`. It registers the model as
`kisansense-classifier` and gives the new version the alias `challenger`.

```bash
mlflow ui --backend-store-uri sqlite:///mlflow.db       # http://localhost:5000
```

Click Experiments, `kisansense`, pick two runs, Compare. Click Models, `kisansense-classifier`:
you see versions and their aliases.

### 4.1 Champion and challenger

- `challenger` is the newest candidate. `train.py` sets it.
- `champion` is what production serves. `promote.py` moves it, and only when the candidate clears the
  F1 floor in `params.yaml` and does at least as well as the current champion on the same test set.

```bash
python src/train.py && python src/gate.py && python src/promote.py
python src/promote.py --rollback 1      # point champion back at version 1, instantly
```

Aliases replaced the old Staging and Production stages in recent MLflow versions, so use aliases.

### 4.2 Why "same test set" matters

After the data changes, the test split changes too. Comparing a new model's F1 on new data to an old
model's F1 on old data tells you nothing. `train.py` scores the current champion on the new test
split and logs `champion_f1_same_test`. `promote.py` compares against that number. Explain this in
your viva, it is the kind of detail examiners ask about.

A known weakness: the new test split can contain rows the champion trained on, which flatters the
champion slightly. The effect is conservative (harder to promote). A cleaner design holds out the
most recent season as a fixed evaluation set.

### 4.3 Shared MLflow server (optional)

Sqlite is fine on one laptop, but CI runners are wiped after each job, so the registry does not
persist across CI runs. For a persistent registry run a server and point everything at it:

```bash
# on an EC2 instance, or locally via docker compose
mlflow server --host 0.0.0.0 --port 5000 \
  --backend-store-uri sqlite:////mlflow/mlflow.db --default-artifact-root s3://<bucket>/mlflow
export MLFLOW_TRACKING_URI=http://<host>:5000
```

Add `MLFLOW_TRACKING_URI` as a GitHub secret and set it in `ci.yml` instead of the sqlite default.
Open port 5000 only to your own IP in the security group. MLflow has no login by default.

---

## 5. Tests, linting and the quality gate

```bash
pytest -q                 # 16 tests: validation, API contract, drift logic
ruff check src tests
python src/gate.py        # exits 1 when F1 or the regional gap break the thresholds
```

Show your examiner a build that fails on purpose: set `min_f1: 0.999` in `params.yaml`, run
`python src/gate.py`, show the non-zero exit, then revert. A pipeline that cannot fail is not a gate.

---

## 6. Containerise

```bash
dvc pull model.joblib data/reference.csv    # or run dvc repro
docker build --build-arg MODEL_VERSION=local -t kisansense:v1 .
docker run --rm -p 8080:8080 -e API_KEY=dev-key kisansense:v1
curl localhost:8080/health
```

Design choices to mention: the image holds only serving dependencies (`requirements-serve.txt`),
runs as a non-root user, uses one gunicorn worker with threads so the in-memory drift window and
metrics are consistent, and carries the model version as a build argument.

Local full stack with monitoring:

```bash
docker compose up --build
# API :8080, MLflow :5000, Prometheus :9090, Grafana :3000 (admin/admin)
```

In Grafana the dashboard "KisanSense serving and drift" is already provisioned.

---

## 7. CI/CD with GitHub Actions

### 7.1 Secrets and variables

Repository, Settings, Secrets and variables, Actions:

| Name | Kind | Used for |
|---|---|---|
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | secret | DVC pull, ECR push |
| `KUBECONFIG_B64` | secret | deploy job (`base64 -w0 ~/.kube/config`) |
| `DEPLOY` = `true` | variable | switches the deploy job on |

Create a dedicated IAM user for CI with only S3 access to your data bucket and ECR push rights.
Never use your root account keys.

### 7.2 What `ci.yml` does

1. `build-test` on every push and PR: install, lint, get data (DVC, else synthetic), validate, pytest,
   train, quality gate, promote, upload the model bundle.
2. `push-image` on `main` only: build the image, tag it with the 8-character Git SHA, push to ECR.
3. `deploy` on `main`, only when `DEPLOY=true`: `kubectl set image`, then `rollout status`. If the new
   pods never become ready, the job fails and the old pods keep serving.

### 7.3 What `retrain.yml` does

Runs weekly, on manual trigger, or on a `drift-detected` repository dispatch: `dvc pull`,
`dvc repro` (fails if the gate fails), `promote.py`, then opens a pull request with the new
`dvc.lock` and metrics. Merging that PR runs `ci.yml`, which ships the new image. A human approves
every model that reaches production.

Trigger it by hand:

```bash
gh workflow run retrain.yml
# or, simulating the alert hook:
gh api repos/<you>/kisansense/dispatches -f event_type=drift-detected
```

Alertmanager cannot call GitHub's dispatch API directly, because the request body it sends does not
match what GitHub expects. Full automation needs a small relay (a Lambda function or a few lines of
Flask). For the course, triggering by hand after the alert fires is acceptable. Say so in your report.

---

## 8. AWS setup

### 8.1 ECR

```bash
aws ecr create-repository --repository-name kisansense --region ap-south-1
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGISTRY=$ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $REGISTRY
docker tag kisansense:v1 $REGISTRY/kisansense:v1
docker push $REGISTRY/kisansense:v1
```

### 8.2 Where the cluster runs, two options

Option A, EC2 with k3s (cheapest, recommended for students). Launch a `t3.small` Ubuntu instance
(`t3.medium` if you also want the Prometheus stack on it), open ports 22 and 30080 to your IP only,
then on the instance:

```bash
curl -sfL https://get.k3s.io | sh -
sudo kubectl get nodes               # kubeconfig is at /etc/rancher/k3s/k3s.yaml
```

k3s does not know your ECR credentials, so create a pull secret (the token lasts 12 hours, refresh it
before demos):

```bash
kubectl create namespace kisansense
kubectl -n kisansense create secret docker-registry ecr-cred \
  --docker-server=$REGISTRY --docker-username=AWS \
  --docker-password="$(aws ecr get-login-password --region ap-south-1)"
kubectl -n kisansense patch serviceaccount default \
  -p '{"imagePullSecrets":[{"name":"ecr-cred"}]}'
```

Option B, EKS (closer to industry, costs more):

```bash
eksctl create cluster --name kisansense --region ap-south-1 --nodes 2 --node-type t3.small
```

EKS nodes pull from ECR through their IAM role, so no pull secret is needed. The control plane bills
by the hour whether or not you use it. Delete it right after your demo:
`eksctl delete cluster --name kisansense --region ap-south-1`.

Either option meets Lab 2: data in S3, image in ECR, service on AWS compute, logs through
`kubectl logs` or CloudWatch.

### 8.3 SageMaker comparison (optional, for the viva)

You can host the same `model.joblib` on a SageMaker endpoint using the scikit-learn container. The
trade you can discuss: SageMaker gives managed scaling and monitoring hooks, Kubernetes gives you
portability and control, and costs differ for a service that idles most of the day.

---

## 9. Kubernetes

### 9.1 Local cluster first

```bash
kind create cluster --name kisansense
kind load docker-image kisansense:v1 --name kisansense

kubectl apply -f k8s/00-namespace.yaml
kubectl -n kisansense create secret generic kisansense-secret --from-literal=api-key=change-me
kubectl apply -k k8s/
kubectl -n kisansense get pods,svc,hpa
```

Reach the service (kind does not expose NodePorts to your machine):

```bash
kubectl -n kisansense port-forward svc/kisansense 8080:80
curl -X POST localhost:8080/predict -H "x-api-key: change-me" -H "Content-Type: application/json" \
  -d '{"N":90,"P":42,"K":43,"temperature":21,"humidity":82,"ph":6.5,"rainfall":203}'
```

On the EC2/k3s option use `http://<ec2-public-ip>:30080` instead.

What the manifests give you:

- Deployment: two replicas, resource requests and limits, readiness and liveness probes on `/health`,
  non-root security context, API key from a Secret, never below desired capacity during rollouts.
- Service: stable name and port in front of the pods.
- HPA: 2 to 6 replicas, scales at 60 percent CPU.

### 9.2 Rolling update and rollback

```bash
# build a "v2" (retrain, or just change MODEL_VERSION), load it, roll it out
docker build --build-arg MODEL_VERSION=v2 -t kisansense:v2 .
kind load docker-image kisansense:v2 --name kisansense

kubectl -n kisansense set image deployment/kisansense api=kisansense:v2
kubectl -n kisansense set env deployment/kisansense MODEL_VERSION=v2
kubectl -n kisansense rollout status deployment/kisansense
kubectl -n kisansense rollout history deployment/kisansense
```

Keep `curl /health` running in a loop in another terminal during the rollout. It never fails, which
is the point of `maxUnavailable: 0`.

Break it on purpose, then recover:

```bash
kubectl -n kisansense set image deployment/kisansense api=kisansense:does-not-exist
kubectl -n kisansense get pods            # new pod stuck in ImagePullBackOff, old pods still serving
kubectl -n kisansense rollout undo deployment/kisansense
```

That demonstrates both zero-downtime deployment and rollback, two phrases the syllabus uses.

### 9.3 Autoscaling

The HPA needs metrics-server. On kind:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl -n kube-system patch deployment metrics-server --type=json \
  -p '[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
kubectl top pods -n kisansense            # works after a minute
```

Then generate load and watch:

```bash
hey -z 120s -c 40 -m POST -H "x-api-key: change-me" -H "Content-Type: application/json" \
  -d '{"N":90,"P":42,"K":43,"temperature":21,"humidity":82,"ph":6.5,"rainfall":203}' \
  http://localhost:8080/predict
kubectl -n kisansense get hpa -w
```

Note: `port-forward` pins traffic to one pod, which blunts the demo. If the pod count does not rise,
run the load from inside the cluster (`kubectl run load --rm -it --image=busybox -- sh`) against
`http://kisansense.kisansense/predict`, or use the EC2 NodePort.

### 9.4 Canary (optional)

```bash
kubectl apply -f k8s/canary.yaml
```

One v2 pod joins two v1 pods behind the same Service, so about a third of requests reach v2. Compare
`model_version` in responses and the per-version metrics. If v2 looks good, update the main Deployment
to v2 and delete the canary. If not, delete the canary.

### 9.5 Useful commands for the viva

```bash
kubectl -n kisansense describe pod <pod>
kubectl -n kisansense logs -l app=kisansense --tail=50
kubectl -n kisansense get events --sort-by=.lastTimestamp
kubectl -n kisansense rollout restart deployment/kisansense
```

---

## 10. Monitoring and logging

### 10.1 What the API exposes

| Metric | Meaning |
|---|---|
| `http_requests_total{endpoint,status}` | traffic and error rate |
| `predict_latency_seconds` (histogram) | latency percentiles |
| `predictions_total{crop}` | which crops get recommended (output drift) |
| `low_confidence_predictions_total` | requests where the top score is below 0.5 |
| `drift_detected`, `feature_drift_ks{feature}`, `drift_window_samples` | input drift |
| `model_info{version}` | which model version each pod is serving |

### 10.2 Prometheus and Grafana on the cluster

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install mon prometheus-community/kube-prometheus-stack -n monitoring --create-namespace

kubectl apply -f k8s/servicemonitor.yaml         # scrape config and alert rules
kubectl -n monitoring port-forward svc/mon-grafana 3000:80
kubectl -n monitoring get secret mon-grafana -o jsonpath="{.data.admin-password}" | base64 -d
```

Log in as `admin`. Dashboards, New, Import, upload `monitoring/grafana/dashboards/kisansense.json`.
If panels say "datasource not found", pick the default Prometheus datasource on the import screen.

The ServiceMonitor carries the label `release: mon`, which must equal the Helm release name. That label
mismatch is the most common reason Prometheus shows no targets. Check Prometheus, Status, Targets.

Alert rules in `k8s/servicemonitor.yaml`: input drift, p95 latency above 200 ms, error rate above 5
percent, more than 30 percent low-confidence predictions. Look at Alertmanager to see them fire during
the drift demo.

### 10.3 Logging

The API writes one JSON object per line to stdout. Containers should log to stdout and let the platform
collect it, which is how every log stack (CloudWatch, Loki, Elastic) expects it.

```bash
kubectl -n kisansense logs -l app=kisansense --tail=20 -f
kubectl -n kisansense logs -l app=kisansense --tail=200 | jq 'select(.msg=="prediction")'
```

A prediction line carries `model_version`, `top_crop`, `confidence`, `latency_ms`. Every line is
therefore attributable to one model version, which is the audit trail Unit 5 asks about.

To keep logs after pods die: on EKS enable the CloudWatch Observability add-on, or install Loki:
`helm install loki grafana/loki-stack -n monitoring` and add Loki as a Grafana datasource. On k3s,
Loki is the easier option. For the course, `kubectl logs` plus a screenshot of the JSON lines is fine,
and mentioning the centralised options shows you know the gap.

For offline analysis set `REQUEST_LOG=logs/requests.jsonl` and run
`python src/drift.py logs/requests.jsonl`.

---

## 11. Drift detection and the retrain loop

### 11.1 How detection works

The API keeps the last 500 request inputs in memory and compares each feature against
`data/reference.csv` (the training features) with the two-sample Kolmogorov-Smirnov test. A feature
counts as drifted when p is below 0.01 and the KS statistic is at least 0.15. Drift is declared when two
or more features drift. The size threshold matters: with large samples the p-value alone flags changes
too small to care about. Each pod has its own window, so with two replicas each sees half the traffic.
That is fine for a demo and a limitation worth stating.

### 11.2 Demo

```bash
kubectl -n kisansense port-forward svc/kisansense 8080:80 &
export API_KEY=change-me
python src/simulate_drift.py http://localhost:8080 normal 300
curl -s localhost:8080/drift | jq '{drift, n_live, drifted_features}'      # drift: false
python src/simulate_drift.py http://localhost:8080 drift 500
curl -s localhost:8080/drift | jq '{drift, drifted_features}'              # drift: true
```

The simulator adds 4 degrees to temperature and cuts rainfall by 30 percent. Expect temperature and
rainfall to flag, with KS statistics around 0.3. Watch the Grafana drift panel turn red and the
`InputDriftDetected` alert go pending, then firing.

### 11.3 Retrain, gate, promote, roll out

```bash
python src/add_new_season.py 50                 # stand-in for newly labelled farm outcomes
dvc add data/raw/Crop_recommendation.csv
dvc repro                                       # train + gate
python src/promote.py                           # champion only if it beats the old one on the same test set
git add -A && git commit -m "retrain on new season" && git push
```

CI builds `kisansense:<sha>` and rolls it out. In the sandbox run, the old champion scored 0.94 F1 on
the new-season test set and the retrained model scored 0.97, so it was promoted. Your numbers will differ
with the real dataset.

This is data drift, which you can see without labels. Concept drift (the right answer changes for the same
inputs) needs fresh labels to detect. In production you would collect farmer outcomes and compare
predictions to them. Say that clearly in the report.

---

## 12. Governance and responsible AI

Do these before submission. They are cheap and each maps to Unit 5.

- Complete `MODEL_CARD.md` with real numbers from `metrics.json`: intended use, limits, data version.
- Fairness check: `train.py` reports F1 per rainfall tercile and the gate caps the gap at 0.10. Rainfall is a
  weak proxy for region. State that, and say what you would use instead (district codes, soil zones).
- Human in the loop: predictions under 0.5 confidence tell the user to consult an agriculture officer.
- Access control: API key from a Kubernetes Secret, never committed. `.gitignore` excludes `secret.yaml`.
- Audit trail: Git SHA, data hash, MLflow run, image tag, and `model_version` in every response and log line.
- Maturity level: at level 0 someone runs a notebook by hand. This project reaches level 2 (automated
  pipeline with tests, gate and registry, drift triggered retrain with human approval). Level 3 would add
  fully automatic promotion and continuous evaluation on labelled outcomes.

---

## 13. Demo script (5 minutes) and report checklist

Demo:

1. Open a PR with a small change, show CI go green (or red on purpose, then fix).
2. Show the MLflow run list and the registry with champion and challenger aliases.
3. `curl /predict` against the cluster, show the top 3 crops.
4. Run load, show the HPA add pods.
5. Roll out v2 with `kubectl set image`, then `rollout undo`.
6. Run drifted traffic, show the Grafana drift panel and the alert.
7. Run the retrain path, show the new model promoted, show `rollout history`.

Report screenshots: DVC `git log` plus `dvc metrics diff`, MLflow compare view, failing quality gate,
Actions run, `kubectl get pods,hpa`, rollout and rollback, Grafana dashboard, drift JSON before and after,
model card.

---

## 14. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `FileNotFoundError: model.joblib` when starting gunicorn | you used `--chdir src`, which changes the working directory. Use `--pythonpath src` |
| MLflow error about untrusted types when logging a model | MLflow 3 defaults to skops; `train.py` uses `serialization_format="cloudpickle"` |
| `docker build` fails at `COPY model.joblib` | run `dvc repro` first, or `dvc pull`. The file is git-ignored |
| scikit-learn warnings or load errors in the container | training and serving versions differ. Keep the pins in `requirements*.txt` equal |
| Pod `ImagePullBackOff` on kind | run `kind load docker-image`, and keep `imagePullPolicy: IfNotPresent` |
| Pod `ImagePullBackOff` on k3s | ECR pull secret missing or expired (12 hour token) |
| HPA shows `<unknown>` for CPU | metrics-server missing or needs `--kubelet-insecure-tls` on kind |
| Prometheus shows no kisansense target | ServiceMonitor `release:` label does not match the Helm release name |
| Grafana panels empty | no traffic yet, or wrong time range, or datasource uid mismatch on import |
| `dvc pull` fails in CI | AWS secrets missing. The workflow falls back to synthetic data, which is fine for a demo only |
| Gate fails after adding data | read the message. If F1 dropped because new data overlaps old classes, that is the finding, not a bug |
| `/drift` says `enough_data: false` | fewer than 100 requests in the window. Send more traffic |

---

## 15. Cost and cleanup

```bash
kind delete cluster --name kisansense
eksctl delete cluster --name kisansense --region ap-south-1     # if you used EKS
aws ec2 terminate-instances --instance-ids <id>                 # if you used EC2
aws ecr delete-repository --repository-name kisansense --force
aws s3 rb s3://kisansense-<yourname>-data --force
```

Check the Billing dashboard a day later. Orphaned load balancers and volumes are the usual leftovers.

---

## 16. Syllabus map

| Syllabus item | Where |
|---|---|
| Unit 1: MLOps components, lifecycle, maturity levels, CI/CD stages | part 7, part 12, architecture diagram |
| Unit 2: data validation, feature handling, data journey, metadata | `validate.py`, part 3, MLflow tags |
| Unit 3: API development, runtime environments, reproducibility, auditability, security, Flask, MLflow | `app.py`, parts 4 and 6, `requirements*.txt` pins |
| Unit 4: CI/CD pipelines, ML artifacts, testing pipeline, deployment strategies, containerisation, scaling | parts 5 to 9 |
| Unit 5: governance, responsible AI, regulation awareness | part 12, `MODEL_CARD.md` |
| Lab 1: personalized recommendation | top-3 crop output personalised to soil and weather (see PROBLEM_STATEMENTS.md option 6 for a literal product recommender) |
| Lab 2: classification model on AWS | parts 3.3, 8 |
| Lab 3: Kubernetes deployment, scaling, monitoring, drift | parts 9 to 11 |
