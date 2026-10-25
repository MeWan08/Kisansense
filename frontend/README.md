# KisanSense frontend

A responsive React application for the Flask crop advisory API. Built with Vite and Lucide icons; standalone modules keep field controls, presets, results, telemetry, settings, and HTTP handling separate.

## Local development

Requires Node.js 22.12+ (or a supported newer release) and npm.

```sh
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite. Choose **Demo** to present without a backend. Demo results are local illustrative calculations against the four presets, not model inference. Live mode never falls back to demo automatically.

The default backend is `http://127.0.0.1:8000` with key `dev-key`. Use the settings button to connect to your API. This repository's Flask default is port **8080**, while the current Docker Compose maps it to **8088**. Set the matching URL in settings, or launch Flask with `PORT=8000` to match the frontend default. The backend must have its trained model available.

Only the backend URL is saved in localStorage. The API key is held in memory and resets on reload. `VITE_API_BASE_URL` can set the default backend at build time; never put secrets into Vite environment variables.

## Build and verification

```sh
npm test
npm run build
npm run preview
```

Serve `dist/` with any static host. No server-side React runtime is required. The included Dockerfile builds the app and serves it using nginx:

```sh
docker build -t kisansense-ui .
docker run --rm -p 3001:80 kisansense-ui
```

Visit `http://localhost:3001`. For a custom build default:

```sh
docker build --build-arg VITE_API_BASE_URL=https://api.example.com -t kisansense-ui .
```

## Deployment integration

- A deployed frontend needs a reachable HTTPS API. Loopback URLs refer to the visitor's computer. Browsers block HTTP APIs from HTTPS pages; use an HTTPS service or a same-origin reverse proxy.
- The existing Flask service enables CORS. For production, limit allowed origins to your frontend and configure the API's real credential. An API key entered in a browser is visible to its user; use a server-side gateway and user authentication if the service requires a private shared secret.
- Health and drift poll independently every 30 seconds, with a manual refresh. Unavailable or insufficient drift data is not reported as nominal.
- Requests time out after 15 seconds. Connection/mode changes cancel active work. Input changes mark prior results as stale. HTTP 400, 401, 422, malformed responses, and network errors have explicit handling.
- Confidence is a model output, not a guarantee of yield. Low-confidence predictions include an agronomist referral.
- Font loading uses Google Fonts with system sans-serif fallbacks; the application remains functional without it.

## Structure

- `src/App.jsx`: workspace state, polling, request lifecycle, and page composition.
- `src/api.js`: URL normalization, timeout/cancellation, request errors, response validation.
- `src/data.js`: field definitions, bounds, presets, and explicit demo calculation.
- `src/components/`: Header, ParameterInput, PresetSelector, RecommendationResults, DriftTelemetryPill, SettingsModal.
- `src/styles.css`: responsive design system, focus states, and reduced-motion support.
- `src/api.test.js`: contract and data validation tests using Node's built-in test runner.

No backend source changes are needed.

### Local CORS compatibility

During Vite development, requests to the default API URL (http://127.0.0.1:8000) are forwarded through Vite's same-origin /api proxy. This supports older running backend processes without CORS headers. Other configured URLs and all production builds use direct requests and require API CORS or a same-origin reverse proxy. The proxy is development-only.
