import test from "node:test";
import assert from "node:assert/strict";
import { request, predict, getDrift, normalizeBaseUrl } from "./api.js";
import { validateValues, PRESETS, demoPrediction } from "./data.js";
const settings = { baseUrl: "http://localhost:8000/", apiKey: "test-key" };
function mockFetch(t, fn) {
  const previous = globalThis.fetch;
  globalThis.fetch = fn;
  t.after(() => {
    globalThis.fetch = previous;
  });
}
test("presets satisfy the model bounds", () => {
  for (const p of PRESETS) assert.deepEqual(validateValues(p.values), {});
});
test("blank, non-finite and out-of-range inputs are rejected", () => {
  assert.deepEqual(
    Object.keys(
      validateValues({
        ...PRESETS[0].values,
        N: "",
        ph: 10,
        humidity: Infinity,
      }),
    ).sort(),
    ["N", "humidity", "ph"],
  );
});
test("base URL removes trailing slashes and rejects unsafe URL forms", () => {
  assert.equal(
    normalizeBaseUrl(" https://example.com/api/ "),
    "https://example.com/api",
  );
  for (const url of [
    "file:///x",
    "https://a:b@example.com",
    "https://example.com?x=1",
  ])
    assert.throws(() => normalizeBaseUrl(url));
});
test("prediction sends exact JSON and authentication header, then ranks results", async (t) => {
  mockFetch(t, async (url, options) => {
    assert.equal(url, "http://localhost:8000/predict");
    assert.equal(options.method, "POST");
    assert.equal(options.headers["x-api-key"], "test-key");
    assert.deepEqual(JSON.parse(options.body), PRESETS[0].values);
    return new Response(
      JSON.stringify({
        model_version: "v2",
        recommendations: [
          { crop: "jute", confidence: 0.3 },
          { crop: "rice", confidence: 0.6 },
          { crop: "maize", confidence: 0.05 },
        ],
      }),
    );
  });
  assert.equal(
    (await predict(settings, PRESETS[0].values)).recommendations[0].crop,
    "rice",
  );
});
for (const status of [400, 401, 422, 500])
  test(`HTTP ${status} produces an actionable error`, async (t) => {
    mockFetch(t, async () => new Response('{"error":"failure"}', { status }));
    await assert.rejects(
      request(settings, "/predict", { body: PRESETS[0].values }),
      (e) => e.status === status && e.message.length > 20,
    );
  });
test("network drop is actionable", async (t) => {
  mockFetch(t, async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(request(settings, "/health"), /Cannot reach the API/);
});
test("invalid response cannot become a recommendation", async (t) => {
  mockFetch(
    t,
    async () =>
      new Response(
        JSON.stringify({
          model_version: "v2",
          recommendations: [{ crop: "rice", confidence: 2 }],
        }),
      ),
  );
  await assert.rejects(
    predict(settings, PRESETS[0].values),
    /incomplete or invalid/,
  );
});
test("insufficient drift data stays distinguishable from nominal", async (t) => {
  mockFetch(
    t,
    async () =>
      new Response(
        JSON.stringify({
          drift: false,
          drifted_features: [],
          enough_data: false,
          n_live: 4,
        }),
      ),
  );
  assert.equal((await getDrift(settings)).enough_data, false);
});
test("invalid drift payload is rejected", async (t) => {
  mockFetch(t, async () => new Response('{"drift":"false"}'));
  await assert.rejects(getDrift(settings), /Invalid drift/);
});
test("demo scenarios provide bounded and ordered sample results", () => {
  for (const p of PRESETS) {
    const r = demoPrediction(p.values);
    assert.equal(r.model_version, "demo");
    assert.equal(r.recommendations[0].crop, p.short.toLowerCase());
    assert.equal(r.recommendations.length, 3);
    assert.ok(
      r.recommendations.every((x) => x.confidence >= 0 && x.confidence <= 1),
    );
  }
});
