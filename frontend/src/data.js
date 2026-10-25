export const PARAMETERS = [
  {
    key: "N",
    name: "Nitrogen",
    symbol: "N",
    min: 0,
    max: 140,
    step: 1,
    unit: "kg/ha",
    group: "soil",
  },
  {
    key: "P",
    name: "Phosphorus",
    symbol: "P",
    min: 5,
    max: 145,
    step: 1,
    unit: "kg/ha",
    group: "soil",
  },
  {
    key: "K",
    name: "Potassium",
    symbol: "K",
    min: 5,
    max: 205,
    step: 1,
    unit: "kg/ha",
    group: "soil",
  },
  {
    key: "ph",
    name: "Soil pH",
    symbol: "pH",
    min: 3.5,
    max: 9.9,
    step: 0.1,
    unit: "pH",
    group: "soil",
  },
  {
    key: "temperature",
    name: "Temperature",
    symbol: "temp",
    min: 8,
    max: 44,
    step: 0.1,
    unit: "°C",
    group: "climate",
  },
  {
    key: "humidity",
    name: "Relative humidity",
    symbol: "humidity",
    min: 14,
    max: 100,
    step: 0.1,
    unit: "%",
    group: "climate",
  },
  {
    key: "rainfall",
    name: "Rainfall",
    symbol: "rain",
    min: 20,
    max: 300,
    step: 0.1,
    unit: "mm",
    group: "climate",
  },
];
export const PRESETS = [
  {
    name: "Monsoon Rice",
    short: "Rice",
    icon: "🌾",
    region: "Tropical · High rainfall",
    values: {
      N: 80,
      P: 48,
      K: 40,
      temperature: 24,
      humidity: 82,
      ph: 6.4,
      rainfall: 236,
    },
  },
  {
    name: "Highland Coffee",
    short: "Coffee",
    icon: "☕",
    region: "Highland · Mild climate",
    values: {
      N: 101,
      P: 29,
      K: 30,
      temperature: 25.5,
      humidity: 58,
      ph: 6.8,
      rainfall: 158,
    },
  },
  {
    name: "Semi-Arid Grapes",
    short: "Grapes",
    icon: "🍇",
    region: "Semi-arid · Low rainfall",
    values: {
      N: 23,
      P: 132,
      K: 200,
      temperature: 23.8,
      humidity: 82,
      ph: 6,
      rainfall: 70,
    },
  },
  {
    name: "Temperate Apple",
    short: "Apple",
    icon: "🍎",
    region: "Temperate · Humid",
    values: {
      N: 21,
      P: 134,
      K: 200,
      temperature: 22.6,
      humidity: 92,
      ph: 5.9,
      rainfall: 113,
    },
  },
];
export function validateValues(values) {
  return Object.fromEntries(
    PARAMETERS.filter(
      (p) =>
        values[p.key] === "" ||
        !Number.isFinite(Number(values[p.key])) ||
        Number(values[p.key]) < p.min ||
        Number(values[p.key]) > p.max,
    ).map((p) => [p.key, `Enter a value between ${p.min} and ${p.max}.`]),
  );
}
export function demoPrediction(values) {
  const scores = PRESETS.map((p) => ({
    crop: p.short.toLowerCase(),
    distance: PARAMETERS.reduce(
      (sum, f) =>
        sum + ((values[f.key] - p.values[f.key]) / (f.max - f.min)) ** 2,
      0,
    ),
  })).sort((a, b) => a.distance - b.distance);
  const confidence = Math.max(0.38, 0.91 - scores[0].distance * 0.45);
  return {
    model_version: "demo",
    recommendations: [
      { crop: scores[0].crop, confidence },
      { crop: scores[1].crop, confidence: (1 - confidence) * 0.65 },
      { crop: scores[2].crop, confidence: (1 - confidence) * 0.25 },
    ],
    ...(confidence < 0.5
      ? {
          advice:
            "Illustrative low-confidence scenario. Please consult your district agriculture officer.",
        }
      : {}),
  };
}
