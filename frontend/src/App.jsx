import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  RotateCcw,
  Layers3,
  CloudSun,
  Sparkles,
  LoaderCircle,
  AlertCircle,
  Github,
  BookOpen,
  Timer,
  SlidersHorizontal,
  Leaf,
  ChevronRight,
  Radio,
  FlaskConical,
} from "lucide-react";
import Header from "./components/Header";
import ParameterInput from "./components/ParameterInput";
import PresetSelector from "./components/PresetSelector";
import RecommendationResults from "./components/RecommendationResults";
import DriftTelemetryPill from "./components/DriftTelemetryPill";
import SettingsModal from "./components/SettingsModal";
import { PARAMETERS, PRESETS, validateValues, demoPrediction } from "./data";
import { predict, getHealth, getDrift } from "./api";
const defaultSettings = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  apiKey: "dev-key",
};
export default function App() {
  const [settings, setSettings] = useState(() => {
    try {
      return {
        ...defaultSettings,
        baseUrl:
          localStorage.getItem("kisansense-base-url") ||
          defaultSettings.baseUrl,
      };
    } catch {
      return defaultSettings;
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [values, setValues] = useState({ ...PRESETS[0].values });
  const [demo, setDemo] = useState(false);
  const [health, setHealth] = useState({ status: "checking" });
  const [drift, setDrift] = useState(null);
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [latency, setLatency] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const activeRequest = useRef(null);
  const errors = validateValues(values);
  const invalid = Object.keys(errors).length > 0;
  useEffect(() => {
    if (demo) {
      setHealth({ status: "demo" });
      setDrift(null);
      return;
    }
    const controller = new AbortController();
    let busy = false;
    setHealth({ status: "checking" });
    setDrift(null);
    async function poll() {
      if (busy) return;
      busy = true;
      const [h, d] = await Promise.allSettled([
        getHealth(settings, controller.signal),
        getDrift(settings, controller.signal),
      ]);
      if (!controller.signal.aborted) {
        setHealth(
          h.status === "fulfilled"
            ? { ...h.value, status: "live" }
            : { status: "offline" },
        );
        setDrift(d.status === "fulfilled" ? d.value : null);
      }
      busy = false;
    }
    poll();
    const timer = setInterval(poll, 30000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [settings, demo, refresh]);
  useEffect(() => () => activeRequest.current?.abort(), []);
  function resetPrediction() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setLoading(false);
    setResult(null);
    setSubmitted(null);
    setError("");
    setLatency(null);
  }
  function switchMode(next) {
    resetPrediction();
    setDemo(next);
  }
  function saveSettings(next) {
    resetPrediction();
    setSettings(next);
    try {
      localStorage.setItem("kisansense-base-url", next.baseUrl);
    } catch {}
    setShowSettings(false);
  }
  async function generate(e) {
    e.preventDefault();
    if (invalid || loading) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    const snapshot = { ...values };
    setError("");
    setLoading(true);
    setResult(null);
    setLatency(null);
    const start = performance.now();
    try {
      let data;
      if (demo) {
        await new Promise((resolve) => setTimeout(resolve, 650));
        data = demoPrediction(snapshot);
      } else data = await predict(settings, snapshot, controller.signal);
      if (controller.signal.aborted) return;
      setResult(data);
      setSubmitted(snapshot);
      setLatency(Math.round(performance.now() - start));
      if (!demo) setRefresh((r) => r + 1);
    } catch (e) {
      if (!controller.signal.aborted) setError(e.message);
    } finally {
      if (activeRequest.current === controller) {
        setLoading(false);
        activeRequest.current = null;
      }
    }
  }
  return (
    <>
      <Header
        health={health}
        demo={demo}
        onSettings={() => setShowSettings(true)}
      />
      <main id="workspace">
        <div className="breadcrumb">
          <Leaf size={13} /> Workspace <ChevronRight size={12} />
          <span>Crop advisory</span>
        </div>
        <section className="intro">
          <div>
            <div className="eyebrow">
              <span /> GROW WITH INTELLIGENCE
            </div>
            <h1>
              Rooted in data.
              <br className="mobile-break" />{" "}
              <span>Growing possibilities.</span>
            </h1>
            <p>
              Turn your soil and climate data into a smarter planting decision.
            </p>
          </div>
          <div className="mode-switch" aria-label="Data source">
            <button
              className={!demo ? "active" : ""}
              onClick={() => switchMode(false)}
              aria-pressed={!demo}
            >
              <Radio size={14} /> Live API
            </button>
            <button
              className={demo ? "active" : ""}
              onClick={() => switchMode(true)}
              aria-pressed={demo}
            >
              <FlaskConical size={14} /> Demo
            </button>
          </div>
        </section>
        <div className="workspace-meta">
          <span>
            <span className="mini-dot" /> PRECISION ADVISORY WORKSPACE
          </span>
          <span>
            {demo
              ? "Demo model · illustrative predictions"
              : health.model_version
                ? `Champion model · ${health.model_version}`
                : "Champion model · awaiting connection"}
            <span className="meta-divider" /> 7 environmental inputs
          </span>
        </div>
        <PresetSelector
          values={values}
          onSelect={(v) => setValues({ ...v })}
          disabled={loading}
        />
        <div className="workspace-grid">
          <form className="input-panel" onSubmit={generate} noValidate>
            <div className="panel-heading">
              <span className="heading-icon">
                <SlidersHorizontal size={19} />
              </span>
              <div>
                <h2>Your growing conditions</h2>
                <p>A little field knowledge goes a long way.</p>
              </div>
              <button
                className="reset-button"
                type="button"
                disabled={loading}
                onClick={() => {
                  setValues({ ...PRESETS[0].values });
                  setError("");
                }}
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>
            <div className="input-section">
              <div className="input-section-heading">
                <Layers3 size={17} />
                <h3>Soil chemistry</h3>
                <span>01 / SOIL</span>
              </div>
              <div className="soil-grid">
                {PARAMETERS.filter((p) => p.group === "soil").map((p) => (
                  <ParameterInput
                    key={p.key}
                    parameter={p}
                    value={values[p.key]}
                    error={errors[p.key]}
                    onChange={(k, v) =>
                      setValues((prev) => ({ ...prev, [k]: v }))
                    }
                    disabled={loading}
                  />
                ))}
              </div>
            </div>
            <div className="input-section climate-section">
              <div className="input-section-heading">
                <CloudSun size={18} />
                <h3>Climate & weather</h3>
                <span>02 / CLIMATE</span>
              </div>
              <div className="climate-grid">
                {PARAMETERS.filter((p) => p.group === "climate").map((p) => (
                  <ParameterInput
                    key={p.key}
                    parameter={p}
                    value={values[p.key]}
                    error={errors[p.key]}
                    onChange={(k, v) =>
                      setValues((prev) => ({ ...prev, [k]: v }))
                    }
                    disabled={loading}
                  />
                ))}
              </div>
            </div>
            <div className="action-area">
              {error && (
                <div className="warning error" role="alert">
                  <AlertCircle size={19} />
                  <div>
                    <strong>Recommendation unavailable</strong>
                    <p>{error}</p>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setShowSettings(true)}
                    >
                      Open connection settings <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
              )}
              <button
                className="primary-button"
                type="submit"
                disabled={invalid || loading}
              >
                {loading ? (
                  <LoaderCircle className="spinning" size={18} />
                ) : (
                  <Sparkles size={18} />
                )}{" "}
                {loading
                  ? "Analyzing your field…"
                  : "Generate Crop Recommendation"}
                {!loading && <ArrowRight size={18} />}
              </button>
              <p className="action-caption">
                {demo ? (
                  <>
                    <FlaskConical size={12} /> Demo mode · sample results, no
                    API required
                  </>
                ) : (
                  <>
                    <span className="mini-dot" /> Powered by your champion model
                    · results in seconds
                  </>
                )}
              </p>
            </div>
          </form>
          <div className="right-column">
            <RecommendationResults
              result={result}
              demo={demo}
              loading={loading}
              stale={
                submitted &&
                JSON.stringify(submitted) !== JSON.stringify(values)
              }
            />
            <div className="field-note">
              <span>🌱</span>
              <div>
                <strong>Every field has a story.</strong>
                <p>
                  Start with accurate readings. Use a recent soil test and
                  seasonal climate averages for more useful results.
                </p>
              </div>
            </div>
          </div>
        </div>
        <section className="telemetry" aria-label="MLOps telemetry">
          <div className="telemetry-label">
            <ActivityIcon />
            <span>
              MODEL OBSERVABILITY
              <small>
                {demo
                  ? "Illustrative session"
                  : "Health & drift checked every 30s"}
              </small>
            </span>
          </div>
          <DriftTelemetryPill drift={drift} demo={demo} />
          <div className="latency">
            <Timer size={17} />
            <div>
              <strong>{latency === null ? "—" : `${latency} ms`}</strong>
              <small>
                {demo ? "Demo response time" : "Round-trip latency"}
              </small>
            </div>
          </div>
          <button
            className="icon-button"
            disabled={demo}
            aria-label="Refresh system telemetry"
            onClick={() => setRefresh((r) => r + 1)}
          >
            <RotateCcw size={16} />
          </button>
        </section>
        <footer>
          <span>
            © {new Date().getFullYear()} KisanSense <i /> Cultivating confidence
            through data.
          </span>
          <div>
            <a
              href="https://github.com/MeWan08/Kisansense"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={14} /> Repository <ArrowUpRight size={12} />
            </a>
            <a
              href="https://github.com/MeWan08/Kisansense/blob/main/MODEL_CARD.md"
              target="_blank"
              rel="noreferrer"
            >
              <BookOpen size={14} /> Model card <ArrowUpRight size={12} />
            </a>
          </div>
        </footer>
      </main>
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
function ActivityIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M2 12h5l3-8 4 16 3-8h5" />
    </svg>
  );
}
