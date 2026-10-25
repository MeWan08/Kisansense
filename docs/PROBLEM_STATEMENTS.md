# Problem statement options

Your syllabus asks for three labs: a personalized product recommendation (Lab 1), a classification
model deployed on AWS (Lab 2), and Kubernetes deployment with drift analysis (Lab 3). Every option
below can carry the same pipeline in this repo. Swap the data and the model, keep the machinery.

Ask your instructor one thing before you commit: whether Lab 1 ("personalized product
recommendation") must be a literal product recommender. Option 6 is built for that case. Option 1
(the one in this repo) is a recommender in the "suggest the best items for this context" sense and
is a classifier, which fits Lab 2 directly.

## 1. KisanSense: crop recommendation under climate drift (the project in this repo)

- Problem: farmers choose crops by habit while monsoon timing and temperature shift year to year.
- Data: Kaggle "Crop Recommendation Dataset" (2,200 rows, 22 crops, 7 numeric features).
- Model: multi-class classifier, top-3 crops with confidence.
- Drift story: weather inputs move with the climate. Easy to simulate, easy to explain, and the
  retrain loop has a clear cause.
- Impact: income and food security for smallholder farmers. Strong story for a viva.
- Difficulty: low on ML, medium on infrastructure. Best choice if time is short.

## 2. Hospital readmission risk, with a governance focus

- Problem: flag diabetic patients likely to be readmitted within 30 days so nurses can follow up.
- Data: UCI "Diabetes 130-US hospitals for years 1999-2008" (about 100,000 encounters).
- Model: gradient boosted trees on tabular features, with per-group fairness checks (age, gender, race).
- Drift story: coding practices and patient mix change across hospitals and years.
- Impact: high, and it makes Unit 5 (governance, responsible AI) the centre of the project.
- Difficulty: medium. Needs careful handling of missing values and an honest model card.
- Watch out: health data. Use only the public dataset and say clearly that it is not for clinical use.

## 3. Air quality forecasting for Indian cities

- Problem: predict next-day AQI category so schools and city offices can issue advisories.
- Data: Kaggle "Air Quality Data in India (2015-2020)" from CPCB. For live data use the OpenAQ API.
- Model: classification of AQI bucket (Good to Severe) or regression on PM2.5.
- Drift story: strong, natural seasonality (winter smog, Diwali, stubble burning). Real drift, no simulation needed.
- Impact: public health, visible to everyone in a demo.
- Difficulty: medium. Time-series splits and missing sensor readings need care.

## 4. Predictive maintenance for industrial machines

- Problem: predict machine failure before it happens to cut unplanned downtime.
- Data: UCI "AI4I 2020 Predictive Maintenance Dataset" (10,000 rows, simple), or NASA C-MAPSS
  turbofan data (harder, remaining useful life).
- Model: binary classifier with heavy class imbalance, or RUL regression.
- Drift story: sensor calibration drift and new machine batches.
- Impact: industrial, an easy sell to a technical audience.
- Difficulty: low (AI4I) to high (C-MAPSS).

## 5. Fraud detection for digital payments

- Problem: flag suspicious card or UPI-style transactions in real time.
- Data: Kaggle "Credit Card Fraud Detection" (ULB, 284,807 transactions, 0.17% fraud).
- Model: classifier tuned for precision and recall on a rare class, with a latency target under 100 ms.
- Drift story: fraud patterns change as fraudsters adapt, which is concept drift, harder than input drift.
- Impact: clear business value, and the canary deployment story is natural (shadow new model first).
- Difficulty: medium. Class imbalance, and the features are anonymised so explanations are limited.

## 6. Personalized product recommendations (literal Lab 1)

- Problem: recommend products a shopper is likely to buy next.
- Data: MovieLens 100K or 1M as a stand-in for items and ratings, or the Amazon product review data
  for a real retail flavour. The Online Retail II dataset (UCI) works for purchase baskets.
- Model: matrix factorisation (implicit ALS) or item-item similarity, evaluated with precision@k or NDCG.
- Drift story: new items and changing tastes (cold start, popularity shifts). Monitor the share of
  recommendations from the top 1% of items and the click-through of served lists.
- Impact: the most recognisable use of ML in industry.
- Difficulty: medium to high. Offline evaluation is harder to explain than a classifier's F1, and the
  "classification model" lab needs a second model, for example a purchase-intent classifier.

## How to choose

| If you care most about | Pick |
|---|---|
| Finishing on time with a strong story | 1 |
| Governance and responsible AI marks | 2 |
| Natural, real drift | 3 |
| Simple data, clear metrics | 4 |
| Concept drift and rare-event modelling | 5 |
| Matching the Lab 1 title exactly | 6 |

Whatever you pick, the grading-relevant parts are the same: versioned data, tracked experiments,
a pipeline that can fail, a containerised service on Kubernetes, monitoring, drift detection, and a
documented retrain-and-rollback path.
