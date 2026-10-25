# Model card: KisanSense crop classifier

**Version:** see MLflow registry alias `champion` (model `kisansense-classifier`)
**Owner:** fill in your name and course details

## Intended use
Advisory tool that suggests which of 22 crops suit a plot, given soil nitrogen, phosphorus,
potassium, pH, and local temperature, humidity and rainfall. It supports a farmer's or
agriculture officer's decision. It does not replace local agronomic advice.

## Not intended for
Crop insurance decisions, loan eligibility, or any use where a wrong suggestion removes a
person's access to money or services.

## Training data
Kaggle "Crop Recommendation Dataset" (2,200 rows, 100 per crop). The synthetic generator in
`src/make_dataset.py` is a development stand-in only. Data version: the `data_md5` tag on the
MLflow run and the hash in `data/raw/*.dvc`.

## Model
Random Forest (scikit-learn), hyperparameters in `params.yaml`.

## Metrics
Fill from `metrics.json` after training: macro F1, accuracy, and F1 per rainfall band
(low, mid, high), which stands in for agro-climatic region.

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
