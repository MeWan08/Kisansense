# KisanSense frontend

React 18 + strict TypeScript + Vite. A mobile-first crop advisory workspace in English, Hindi and Marathi, with light/dark themes and transparent model monitoring.

## Run locally

Use Node **22.13+** (or a newer supported release) and npm.

```sh
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

In PowerShell use `Copy-Item .env.example .env.local`. Open the URL printed by Vite. The root route selects the saved language, defaulting to `/en`. All routes support `/en`, `/hi`, and `/mr`.

The local `.env.local` is ignored by Git and Docker. The example key is a public development credential, not a private deployment secret. Enter a different key through Connection settings when needed. Only the backend URL, language, and appearance preference are saved in localStorage. Credentials and observation history stay in memory.

The default API at `http://127.0.0.1:8000` is forwarded through Vite's `/api` proxy during development. This supports an older Flask process without CORS enabled. Other URLs use direct browser requests. Production builds do not include that proxy.

## Scripts

| Script                               | Purpose                                                   |
| ------------------------------------ | --------------------------------------------------------- |
| `npm run dev`                        | Local development                                         |
| `npm run build`                      | Strict TypeScript check and optimized SPA output          |
| `npm run preview`                    | Preview `dist/` (direct API access, no development proxy) |
| `npm run typecheck`                  | Strict TypeScript verification                            |
| `npm run lint`                       | ESLint and React Hooks checks                             |
| `npm test`                           | Vitest and React Testing Library tests                    |
| `npm run test:contrast`              | Shared text, status, and control contrast checks          |
| `npm run test:watch`                 | Interactive unit-test development                         |
| `npm run format`                     | Prettier formatting                                       |
| `node scripts/generate-profiles.cjs` | Regenerate crop profiles from the repository dataset      |

Vitest disables Node 25's experimental Web Storage implementation in worker processes because it interferes with jsdom's localStorage. Node 22 CI uses jsdom normally.

## Routes and structure

- `/:locale`: landing, methodology summary and recorded benchmark.
- `/:locale/recommend`: seven validated readings, presets, live/demo modes and three ranked crops.
- `/:locale/crops`: all 22 classes, search, category filters and reference profiles.
- `/:locale/monitoring`: model health, optional evaluation metrics, session charts and feature drift.
- `/:locale/about`: methodology, dataset, limitations and language review notice.
- Unmatched paths: localized 404; rendering failures: recovery boundary.

```text
src/
  components/ui/          Accessible Radix-based primitives and feedback
  components/layout/      Navbar, footer, modal, preferences, SEO, boundary
  features/
    landing/
    recommend/
    crops/
    monitoring/           Charts load separately from the page
    docs/
  hooks/                   Theme, workspace, telemetry and formatting
  lib/api/                 Typed Zod schemas, fetch client, mock fixtures
  lib/                     Field contract, motion, storage, i18n
  locales/{en,hi,mr}/       common, landing, recommend, crops, monitoring, docs
  styles/                  CSS-variable tokens and responsive components
  test/                    Test setup and providers
```

## Environment variables

| Variable        | Default                 | Use                                  |
| --------------- | ----------------------- | ------------------------------------ |
| `VITE_API_URL`  | `http://127.0.0.1:8000` | Base URL, without endpoint suffix    |
| `VITE_API_KEY`  | empty                   | Optional browser-visible default key |
| `VITE_USE_MOCK` | `false`                 | `true` starts in explicit demo mode  |
| `VITE_SITE_URL` | current origin          | Canonical HTTPS origin for SEO       |

Every `VITE_*` value is public in the built client. Never provide a private shared production credential through these variables. If a private credential is required, use an authenticated server-side gateway. Runtime Connection settings let authorized users enter their own browser-appropriate key.

## API contract and truthfulness

`POST /predict`, `GET /health`, and `GET /drift` match `src/app.py`. Responses are Zod-validated; invalid, duplicate, or out-of-range recommendation data is rejected. All requests have a 15-second timeout and cancellation support. 400, 401, 404, 422, service errors and network failures map to localized messages.

`GET /model-info` is optional and **is not implemented by the current Flask source**. If supplied, it should return:

```json
{ "model_version": "v2", "accuracy": 0.9697, "macro_f1": 0.9696 }
```

Missing live metrics remain unavailable. The landing benchmark is explicitly the recorded v2 repository result from `metrics.json`, not a claim about the currently served model. Model versions are displayed as returned by the API; the UI cannot independently verify MLflow's champion alias.

Health and drift refresh every 30 seconds. Drift indicators require actual feature statistics; an insufficient sample window is shown as collecting, never stable. The view uses the backend rule from `src/config.py`: p < 0.01 and KS >= 0.15, with two drifted features for an overall alert. A review state indicates statistical significance with a smaller effect.

Charts show up to 30 successful predictions from **this browser session**, not fleet-wide metrics. They reset when the connection or mode changes. Charts include screen-reader data tables. Demo predictions compare the four example profiles locally and are labeled illustrative throughout; they do not simulate real model inference silently.

## Crop reference data

`features/crops/profiles.json` contains 10th–90th percentile ranges derived from the workspace CSV for all seven inputs and all 22 crops. It includes the source SHA-256 and row count. The project model card describes synthetic seasonal shifts. These descriptive ranges are not fertilizer doses or validated local agronomy limits.

Regenerate after changing the dataset with `node scripts/generate-profiles.cjs`. The CSV must be present locally (DVC pull or dataset generation). Builds use the committed summary and do not require the raw dataset.

## Add a language

1. Create a folder under `src/locales/` and provide every namespace with the same keys.
2. Add the locale and display name to `lib/i18n.ts` and the inline language check in `index.html`.
3. Add the appropriate font and readable line-height if the script needs them.
4. Review all crop names, units and safety language with a native-speaking agriculture advisor.
5. Run tests; the locale test enforces matching keys and crop names.

`useFormat` handles display numbers, percentages and timestamps. Native numeric inputs use browser-supported decimal entry. See `LANGUAGE_REVIEW.md` for the current native-review list.

## Add a component

Place reusable primitives in `components/ui`, domain UI beside its feature, and API schemas in `lib/api`. Use CSS variables rather than new literal colors, shared field definitions instead of duplicated ranges, and locale keys instead of UI strings. Keep focus indicators and 44px targets. Motion uses the shared timing and only transform/opacity; users requesting reduced motion receive static states. Tooltips supplement visible labels; they never contain the only essential instruction.

## Build and deploy

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

The output is a static SPA in `dist/`. The nginx image includes SPA fallback, gzip, immutable hashed-asset caching, uncached HTML and health checks.

```sh
docker build -t kisansense-ui \
  --build-arg VITE_API_URL=https://api.example.com \
  --build-arg VITE_SITE_URL=https://app.example.com frontend
docker run --rm -p 3001:80 kisansense-ui
```

Run these Docker commands from the repository root. For a backend-free demo build, add `--build-arg VITE_USE_MOCK=true`. Do not bake credentials into the image. For an HTTPS site, the API must also use HTTPS, or sit behind a same-origin reverse proxy; a loopback address refers to the visitor's device.

`.github/workflows/frontend.yml` runs lint, typecheck, tests and build, then uploads `dist/`. Optional ECR publishing follows the existing repository's credentials and `eu-north-1` region, and is disabled unless `FRONTEND_ECR_PUSH=true` is set. Configure `FRONTEND_ECR_REPOSITORY`, `FRONTEND_API_URL`, and `FRONTEND_SITE_URL`. Images use the eight-character commit tag.

On EC2, pull that image with the instance's ECR access and run it alongside the existing API on a distinct host port, e.g. `docker run -d --restart unless-stopped --name kisansense-ui -p 3001:80 IMAGE`. Route the public HTTPS frontend host to that port through your existing load balancer or reverse proxy. The workflow does not alter running EC2 containers or backend deployments automatically.

## Verification limits

See `VERIFICATION.md` for executed checks. A Lighthouse 95+ score is a target to measure on the production build and hosting environment, not a claimed result. Native-speaker sign-off and testing on a physical mid-range Android device remain release checks.

The build normalizes two misleading prose comments in Zod 4.6 that Rollup otherwise interprets as purity annotations. This does not change dependency behavior or suppress application build warnings.
