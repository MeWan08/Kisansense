import type { z } from "zod";
import {
  driftSchema,
  healthSchema,
  modelInfoSchema,
  predictionSchema,
  type Connection,
} from "./schemas";
import type { Readings } from "../fields";
export class ApiError extends Error {
  constructor(
    public key: string,
    public status = 0,
  ) {
    super(key);
    this.name = "ApiError";
  }
}
export function normalizeUrl(value: string) {
  const url = new URL(value.trim());
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("urlError");
  return url.href.replace(/\/+$/, "");
}
export async function request<T>(
  connection: Connection,
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
  body?: Readings,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 15000);
  try {
    const base = normalizeUrl(connection.baseUrl);
    const transport =
      import.meta.env.DEV && base === "http://127.0.0.1:8000" ? "/api" : base;
    const response = await fetch(`${transport}${path}`, {
      method: body ? "POST" : "GET",
      signal: controller.signal,
      headers: {
        "x-api-key": connection.apiKey,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok)
      throw new ApiError(
        (
          {
            400: "validationError",
            401: "authError",
            422: "validationError",
            404: "missingError",
          } as Record<number, string>
        )[response.status] ?? "serverError",
        response.status,
      );
    const parsed = schema.safeParse(await response.json().catch(() => null));
    if (!parsed.success) throw new ApiError("responseError");
    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal?.aborted) throw error;
    throw new ApiError(
      controller.signal.aborted ? "timeoutError" : "networkError",
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
async function mock() {
  return import("./mock");
}
export const api = {
  health: async (c: Connection, s?: AbortSignal) =>
    c.mock
      ? (await mock()).mockHealth()
      : request(c, "/health", healthSchema, s),
  drift: async (c: Connection, s?: AbortSignal) =>
    c.mock ? (await mock()).mockDrift() : request(c, "/drift", driftSchema, s),
  modelInfo: async (c: Connection, s?: AbortSignal) =>
    c.mock
      ? (await mock()).mockModelInfo()
      : request(c, "/model-info", modelInfoSchema, s),
  predict: async (c: Connection, values: Readings, s?: AbortSignal) => {
    const result = c.mock
      ? await (await mock()).mockPredict(values, s)
      : await request(c, "/predict", predictionSchema, s, values);
    return {
      ...result,
      recommendations: [...result.recommendations].sort(
        (a, b) => b.confidence - a.confidence,
      ),
    };
  },
};
