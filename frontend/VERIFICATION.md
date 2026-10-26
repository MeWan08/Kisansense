# Frontend verification

Verified locally on 26 October 2026. This is an implementation review, not a certification of accessibility, agronomic accuracy, or production hosting.

## Executed checks

- Strict TypeScript and Vite production build: pass, without application build warnings.
- ESLint: pass, without warnings.
- Vitest / React Testing Library: 5 suites, 19 tests pass. The focused dialog and error-boundary tests were rerun after cleaning expected error diagnostics: 2 tests pass.
- API tests cover response validation, duplicate crop rejection, HTTP 400/401/404/422/500, network failures, timeout, URL validation, and insufficient drift data.
- UI tests cover form synchronization, presets, bounds, low-confidence advice, stale results, language switching, theme persistence, dialog dismissal/focus restoration, and error recovery.
- Locale checks: matching translation keys and all 22 crop names across English, Hindi, and Marathi.
- `npm run test:contrast`: all 18 shared text/status/control token combinations pass their 4.5:1 text or 3:1 non-text thresholds in both themes. This checks tokens, not every rendered element.
- Dependency audit during a clean Docker install: zero reported vulnerabilities. npm reports a transitive `whatwg-encoding` deprecation notice; installation succeeds.
- `git diff --check`: pass.

## Browser observations

Checked in the desktop app's Chromium browser:

- English landing and advisory in both light and dark themes.
- Live development-proxy prediction: rice 97.4%, jute 2.6%, pomegranate 0.0%; model version returned by that local API was `dev`.
- Hindi advisory at 360px, Marathi advisory/monitoring at 768px, English at 1280px and crop library at 1920px; no horizontal document overflow observed at those checks.
- Crop search, single-result count, reference-profile dialog, and all seven input ranges.
- Monitoring session charts after a successful prediction; unsupported live model metrics remain unavailable.
- About/methodology content and localized Hindi 404 recovery.
- Production Docker demo: recommendation, three ranked crops, loading state, explicit demo labeling, and dark theme.

The production dark-theme advisory screenshot is saved one level above the repository as `kisansense-frontend-v2.png`.

## Container smoke test

Built `kisansense-ui:verification` from `frontend/Dockerfile` using Node 22 and nginx, with `VITE_USE_MOCK=true`. Ran a temporary container bound only to `127.0.0.1:4174`.

- Container health check: healthy.
- Direct `/hi/recommend` request: HTTP 200 with SPA HTML.
- HTML cache policy: `no-cache`.
- Hashed JavaScript: HTTP 200, one-year cache lifetime and `immutable`.
- Raw HTTP headers with `Accept-Encoding: gzip`: `Content-Encoding: gzip`.
- Rendered the served production bundle and generated a demo recommendation in the browser.

The verification container and development preview are stopped after testing. The local verification image remains available; nothing was pushed or deployed.

## Remaining release checks

- Measure Lighthouse against the production build on the intended host. The requested 95+ score has not been measured or claimed.
- Test a physical mid-range Android device, real touch behavior, and assistive technology. Browser viewport checks and focused keyboard tests are not a complete WCAG audit.
- Obtain native Hindi and Marathi agricultural-language review; see `LANGUAGE_REVIEW.md`.
- Configure the production HTTPS API URL and allowed CORS origin (or a same-origin gateway). The development proxy does not exist in production.
- Supply `/model-info` if live evaluation metrics are wanted. The current backend does not implement it; the frontend handles its absence.
- Exercise CI/ECR and hosting with the deployment account. The workflow is prepared but has not been run remotely.
