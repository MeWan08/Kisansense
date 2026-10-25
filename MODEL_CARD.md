# Model card: KisanSense crop classifier

**Version:** 2 (MLflow registry alias `champion`, model `kisansense-classifier`)
**Owner:** KisanSense MLOps Project
**License:** MIT

## Intended use
Advisory tool that suggests which of 22 crops suit a plot, given soil nitrogen, phosphorus,
potassium, pH, and local temperature, humidity and rainfall. It supports a farmer's or
agriculture officer's decision. It does not replace local agronomic advice.

## Not intended for
Crop insurance decisions, loan eligibility, or any use where a wrong suggestion removes a
person's access to money or services.

## Training data
Kaggle "Crop Recommendation Dataset" with simulated seasonal climate shifts (3,300 rows total).
Data versioning: tracked via DVC with MD5 hashes (`data/raw/Crop_recommendation.csv.dvc`).

## Model
Random Forest Classifier (`n_estimators=300`, `max_depth=20`, `seed=42`).

## Metrics (from metrics.json)
- **Macro F1 Score:** 0.9696 (96.96%)
- **Overall Accuracy:** 0.9697 (96.97%)
- **Fairness by Rainfall Zone (Agro-climatic region proxy):**
  - Low Rainfall Zone: 0.9622 F1
  - Mid Rainfall Zone: 0.9923 F1
  - High Rainfall Zone: 0.9689 F1
  - **Regional Gap:** 0.0301 (Well under the maximum threshold of 0.10)
- **Evaluation vs Previous Champion:** Retrained model beat the previous champion (0.9696 vs 0.9376) on the same held-out test split, satisfying the promotion contract.

## Known limits
- Only 22 crops. No market price, irrigation, seed variety, pest or labour inputs.
- The public dataset is balanced and clean, which real farm data is not.
- Rainfall tercile is a weak proxy for region. A real deployment needs district labels.
- Confidence scores come from tree votes and are not calibrated probabilities.
- Low-confidence results (top score under 0.5) tell the user to consult an agriculture officer.

## Monitoring and retraining
Input drift is checked with a KS test on a rolling window of 500 requests (flag when two or
more features have p < 0.01 and KS >= 0.15). Drift alerts a human, and the retrain workflow
produces a candidate that must pass the quality gate and beat the current champion before promotion.

## Audit trail
Git commit (code), DVC hash (data), MLflow run id (parameters, metrics, artifacts), image tag
(equals commit SHA), and the `model_version` field in every API response and log line.
