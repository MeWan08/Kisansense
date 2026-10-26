import { z } from "zod";
export const fields = [
  { key: "N", min: 0, max: 140, step: 1, unit: "kg", group: "soil" },
  { key: "P", min: 5, max: 145, step: 1, unit: "kg", group: "soil" },
  { key: "K", min: 5, max: 205, step: 1, unit: "kg", group: "soil" },
  { key: "ph", min: 3.5, max: 9.9, step: 0.1, unit: "phUnit", group: "soil" },
  {
    key: "temperature",
    min: 8,
    max: 44,
    step: 0.1,
    unit: "celsius",
    group: "climate",
  },
  {
    key: "humidity",
    min: 14,
    max: 100,
    step: 0.1,
    unit: "percent",
    group: "climate",
  },
  {
    key: "rainfall",
    min: 20,
    max: 300,
    step: 0.1,
    unit: "mm",
    group: "climate",
  },
] as const;
export type FieldKey = (typeof fields)[number]["key"];
export type Readings = Record<FieldKey, number>;
export const readingSchema = z.object(
  Object.fromEntries(
    fields.map((f) => [f.key, z.number().finite().min(f.min).max(f.max)]),
  ) as Record<FieldKey, z.ZodNumber>,
);
export const presets: { id: string; crop: string; values: Readings }[] = [
  {
    id: "ricePreset",
    crop: "rice",
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
    id: "coffeePreset",
    crop: "coffee",
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
    id: "grapesPreset",
    crop: "grapes",
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
    id: "applePreset",
    crop: "apple",
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
export const LOW_CONFIDENCE = 0.5;
export const STRONG_CONFIDENCE = 0.8;
export const POLL_INTERVAL = 30000;
export const MAX_OBSERVATIONS = 30;
export const DRIFT_RULE = {
  pValue: 0.01,
  ks: 0.15,
  minSamples: 100,
  window: 500,
};
