import { describe, it, expect, vi, afterEach } from "vitest";
import { api, ApiError, normalizeUrl, request } from "./index";
import { healthSchema, type Connection } from "./schemas";
import { presets } from "../fields";
const connection: Connection = {
  baseUrl: "https://api.example.com",
  apiKey: "test-only",
  mock: false,
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("API boundary", () => {
  it("posts seven readings with the configured key and ranks results", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          model_version: "v2",
          recommendations: [
            { crop: "jute", confidence: 0.3 },
            { crop: "rice", confidence: 0.6 },
            { crop: "maize", confidence: 0.04 },
          ],
        }),
      ),
    );
    vi.stubGlobal("fetch", fetcher);
    const result = await api.predict(connection, presets[0].values);
    expect(result.recommendations[0].crop).toBe("rice");
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.example.com/predict");
    expect(options.headers["x-api-key"]).toBe("test-only");
    expect(JSON.parse(options.body)).toEqual(presets[0].values);
  });
  it.each([
    [401, "authError"],
    [422, "validationError"],
    [400, "validationError"],
    [500, "serverError"],
    [404, "missingError"],
  ])("maps status %s to localized key", async (status, key) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: Number(status) })),
    );
    await expect(api.health(connection)).rejects.toMatchObject({ key });
  });
  it("rejects invalid and duplicate crop results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            model_version: "v2",
            recommendations: [
              { crop: "rice", confidence: 0.8 },
              { crop: "rice", confidence: 0.2 },
              { crop: "jute", confidence: 0.1 },
            ],
          }),
        ),
      ),
    );
    await expect(
      api.predict(connection, presets[0].values),
    ).rejects.toMatchObject({ key: "responseError" });
  });
  it("maps network drops without exposing server text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("secret internal text")),
    );
    await expect(api.health(connection)).rejects.toEqual(
      new ApiError("networkError"),
    );
  });
  it("times out and aborts the transport", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      ),
    );
    const assertion = expect(
      request(connection, "/health", healthSchema),
    ).rejects.toMatchObject({ key: "timeoutError" });
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;
  });
  it("validates connection URLs", () => {
    expect(normalizeUrl(" https://api.example.com/ ")).toBe(
      "https://api.example.com",
    );
    for (const value of [
      "file:///a",
      "https://user:pass@example.com",
      "https://example.com?key=1",
    ])
      expect(() => normalizeUrl(value)).toThrow();
  });
  it("preserves an insufficient-data drift report", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              drift: false,
              drifted_features: [],
              enough_data: false,
              n_live: 2,
              features: {},
            }),
          ),
        ),
    );
    expect((await api.drift(connection)).enough_data).toBe(false);
  });
});
