"""Shared constants. Keep feature names and valid ranges in one place so that
validation, training, the API and drift monitoring cannot disagree."""

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

# Physically plausible ranges. Used by data validation and by the API to reject nonsense input.
RANGES = {
    "N": (0, 140),
    "P": (5, 145),
    "K": (5, 205),
    "temperature": (8, 44),
    "humidity": (14, 100),
    "ph": (3.5, 9.9),
    "rainfall": (20, 300),
}

# Drift rule: a feature counts as drifted when the KS test is significant AND the
# effect size is not tiny. p-value alone flags trivial shifts once the sample is large.
DRIFT_P_VALUE = 0.01
DRIFT_MIN_KS = 0.15
DRIFT_MIN_FEATURES = 2      # alert when at least this many features drift
DRIFT_MIN_SAMPLES = 100     # do not judge drift on fewer live requests than this
WINDOW_SIZE = 500           # rolling window of recent requests kept in memory

LOW_CONFIDENCE = 0.5        # below this the API tells the farmer to ask an officer
