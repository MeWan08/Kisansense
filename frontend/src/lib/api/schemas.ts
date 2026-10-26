import { z } from "zod";
export const cropIds = [
  "rice",
  "maize",
  "chickpea",
  "kidneybeans",
  "pigeonpeas",
  "mothbeans",
  "mungbean",
  "blackgram",
  "lentil",
  "pomegranate",
  "banana",
  "mango",
  "grapes",
  "watermelon",
  "muskmelon",
  "apple",
  "orange",
  "papaya",
  "coconut",
  "cotton",
  "jute",
  "coffee",
] as const;
export const predictionSchema = z.object({
  model_version: z.string().min(1),
  recommendations: z
    .array(
      z.object({ crop: z.enum(cropIds), confidence: z.number().min(0).max(1) }),
    )
    .length(3)
    .refine((rows) => new Set(rows.map((r) => r.crop)).size === rows.length),
  advice: z.string().optional(),
});
export const healthSchema = z.object({
  status: z.literal("ok"),
  model_version: z.string().min(1),
});
export const featureDriftSchema = z.object({
  ks: z.number().min(0).max(1),
  p_value: z.number().min(0).max(1),
  drift: z.boolean(),
});
export const driftSchema = z.object({
  drift: z.boolean(),
  drifted_features: z.array(z.string()),
  enough_data: z.boolean().optional(),
  n_live: z.number().nonnegative().optional(),
  features: z.record(z.string(), featureDriftSchema).optional(),
});
export const modelInfoSchema = z.object({
  model_version: z.string(),
  accuracy: z.number().min(0).max(1).optional(),
  macro_f1: z.number().min(0).max(1).optional(),
});
export type Prediction = z.infer<typeof predictionSchema>;
export type Drift = z.infer<typeof driftSchema>;
export type FeatureDrift = z.infer<typeof featureDriftSchema>;
export type CropId = (typeof cropIds)[number];
export interface Connection {
  baseUrl: string;
  apiKey: string;
  mock: boolean;
}
