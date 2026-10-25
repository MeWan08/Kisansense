export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
export function normalizeBaseUrl(value) {
  const url = new URL(value.trim());
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      "Use an HTTP or HTTPS URL without credentials, query parameters, or fragments.",
    );
  return url.href.replace(/\/+$/, "");
}
export async function request(settings, path, { signal, body } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const configuredBase = normalizeBaseUrl(settings.baseUrl);
    // Vite forwards the default local service so older Flask processes without CORS work in development.
    const transportBase =
      import.meta.env?.DEV && configuredBase === "http://127.0.0.1:8000"
        ? "/api"
        : configuredBase;
    const response = await fetch(`${transportBase}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        "x-api-key": settings.apiKey,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const messages = {
        400: "The request could not be read. Check all seven inputs.",
        401: "API key rejected. Update your key in Connection settings.",
        422: "Some values are outside the model’s supported ranges.",
      };
      throw new ApiError(
        messages[response.status] ||
          `The service returned an error (${response.status}). Please retry.`,
        response.status,
      );
    }
    if (!data || typeof data !== "object")
      throw new ApiError("The service returned an invalid response.");
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal?.aborted) throw error;
    throw new ApiError(
      error.name === "AbortError"
        ? "The service took too long to respond. Please retry."
        : "Cannot reach the API. Check the backend URL, network connection, and CORS configuration.",
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
export async function predict(settings, values, signal) {
  const data = await request(settings, "/predict", { body: values, signal });
  if (
    typeof data.model_version !== "string" ||
    !Array.isArray(data.recommendations) ||
    data.recommendations.length < 3 ||
    data.recommendations.some(
      (r) =>
        typeof r.crop !== "string" ||
        !Number.isFinite(r.confidence) ||
        r.confidence < 0 ||
        r.confidence > 1,
    ) ||
    (data.advice !== undefined && typeof data.advice !== "string")
  )
    throw new ApiError("The prediction response is incomplete or invalid.");
  return {
    ...data,
    recommendations: [...data.recommendations]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3),
  };
}
export async function getHealth(settings, signal) {
  const data = await request(settings, "/health", { signal });
  if (data.status !== "ok" || typeof data.model_version !== "string")
    throw new ApiError("Service is not ready.");
  return data;
}
export async function getDrift(settings, signal) {
  const data = await request(settings, "/drift", { signal });
  if (
    typeof data.drift !== "boolean" ||
    !Array.isArray(data.drifted_features) ||
    data.drifted_features.some((f) => typeof f !== "string")
  )
    throw new ApiError("Invalid drift response.");
  return data;
}
