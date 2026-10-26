import { fields, presets, LOW_CONFIDENCE, type Readings } from "../fields";
import type { Prediction, Drift, CropId } from "./schemas";
export const mockHealth = () => ({
  status: "ok" as const,
  model_version: "demo-v2",
});
export const mockModelInfo = () => ({
  model_version: "demo-v2",
  accuracy: 0.9697,
  macro_f1: 0.9696,
});
export const mockDrift = (): Drift => ({
  drift: false,
  enough_data: true,
  n_live: 240,
  drifted_features: [],
  features: Object.fromEntries(
    fields.map((f, i) => [
      f.key,
      { ks: 0.025 + i * 0.008, p_value: 0.6 - i * 0.06, drift: false },
    ]),
  ),
});
export async function mockPredict(
  values: Readings,
  signal?: AbortSignal,
): Promise<Prediction> {
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, 550);
    signal?.addEventListener("abort", abort, { once: true });
  });
  const ranked = presets
    .map((p) => ({
      crop: p.crop as CropId,
      distance: fields.reduce(
        (sum, f) =>
          sum + ((values[f.key] - p.values[f.key]) / (f.max - f.min)) ** 2,
        0,
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
  const confidence = Math.max(0.38, 0.91 - ranked[0].distance * 0.45);
  return {
    model_version: "demo-v2",
    recommendations: [
      { crop: ranked[0].crop, confidence },
      { crop: ranked[1].crop, confidence: (1 - confidence) * 0.65 },
      { crop: ranked[2].crop, confidence: (1 - confidence) * 0.25 },
    ],
    ...(confidence < LOW_CONFIDENCE ? { advice: "low-confidence" } : {}),
  };
}
