import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Minus,
  CheckCircle2,
  Clock3,
  ArrowRight,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useHealth, useDrift, useModelInfo } from "../../hooks/useTelemetry";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useFormat } from "../../hooks/useFormat";
import { fields, DRIFT_RULE } from "../../lib/fields";
import type { FeatureDrift } from "../../lib/api/schemas";
import { ApiError } from "../../lib/api";
import { Badge, Button, ErrorNotice, Skeleton } from "../../components/ui";
const SessionCharts = lazy(() => import("./SessionCharts"));
export function featureStatus(feature?: FeatureDrift) {
  return !feature
    ? "unavailable"
    : feature.drift
      ? "drifted"
      : feature.p_value < DRIFT_RULE.pValue
        ? "warning"
        : "stable";
}
export default function MonitoringPage() {
  const { t } = useTranslation("monitoring");
  const { t: c } = useTranslation();
  const { locale } = useParams();
  const health = useHealth();
  const drift = useDrift();
  const info = useModelInfo();
  const { observations } = useWorkspace();
  const format = useFormat();
  const latest = observations.at(-1);
  const report = drift.isError ? undefined : drift.data;
  const status = !report
    ? "unavailable"
    : report.enough_data === false
      ? "collecting"
      : report.drift
        ? "detected"
        : "nominal";
  const refresh = () => {
    void health.refetch();
    void drift.refetch();
    void info.refetch();
  };
  const checked = Math.max(drift.errorUpdatedAt, drift.dataUpdatedAt);
  return (
    <div className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
        <Button
          variant="secondary"
          onClick={refresh}
          busy={health.isFetching || drift.isFetching}
          disabled={health.isFetching || drift.isFetching}
        >
          <RefreshCw size={16} />
          {t("refresh")}
        </Button>
      </div>
      {health.isError && (
        <ErrorNotice
          message={c(
            health.error instanceof ApiError
              ? health.error.key
              : "networkError",
          )}
          onRetry={refresh}
        />
      )}
      <section className="monitor-metrics">
        <div>
          <span>{t("champion")}</span>
          <strong>
            {health.isError ? "—" : (health.data?.model_version ?? "—")}
          </strong>
          <Badge
            tone={
              health.isError ? "danger" : health.data ? "success" : "neutral"
            }
          >
            {c(
              health.isError
                ? "offline"
                : health.data
                  ? "connected"
                  : "checking",
            )}
          </Badge>
        </div>
        <div>
          <span>{t("accuracy")}</span>
          <strong>
            {info.data?.accuracy !== undefined && !info.isError
              ? format.percent(info.data.accuracy)
              : "—"}
          </strong>
          <small>{t("accuracy")}</small>
        </div>
        <div>
          <span>{t("f1")}</span>
          <strong>
            {info.data?.macro_f1 !== undefined && !info.isError
              ? format.number(info.data.macro_f1, 4)
              : "—"}
          </strong>
          <small>{t("f1")}</small>
        </div>
        <div>
          <span>{t("latency")}</span>
          <strong>
            {latest ? format.number(latest.latency) : "—"}{" "}
            <small>{c("ms")}</small>
          </strong>
          <small>
            {t("requests")}: {format.number(observations.length)}
          </small>
        </div>
      </section>
      {info.isError && (
        <p className="metric-note">
          {info.error instanceof ApiError && info.error.status === 404
            ? t("metricsMissing")
            : c(
                info.error instanceof ApiError
                  ? info.error.key
                  : "networkError",
              )}
        </p>
      )}
      <div className="session-heading">
        <Activity size={18} />
        <p>{t("sessionOnly")}</p>
      </div>
      {observations.length ? (
        <Suspense
          fallback={
            <div className="chart-grid">
              <Skeleton className="chart-panel" />
              <Skeleton className="chart-panel" />
            </div>
          }
        >
          <SessionCharts observations={observations} />
        </Suspense>
      ) : (
        <div className="observations-empty">
          <Activity size={32} />
          <p>{t("noObservations")}</p>
          <Link className="text-link" to={`/${locale}/recommend`}>
            {c("start")}
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <section className="drift-panel">
        <div className="drift-heading">
          <div>
            <h2>
              <ShieldCheck size={22} />
              {t("driftTitle")}
            </h2>
            <p>{t("driftBody")}</p>
          </div>
          <Badge
            tone={
              status === "detected"
                ? "danger"
                : status === "nominal"
                  ? "success"
                  : "neutral"
            }
          >
            {status === "detected" ? (
              <TriangleAlert size={14} />
            ) : status === "nominal" ? (
              <CheckCircle2 size={14} />
            ) : (
              <Clock3 size={14} />
            )}{" "}
            {t(status)}
          </Badge>
        </div>
        {drift.isError && (
          <ErrorNotice
            message={c(
              drift.error instanceof ApiError
                ? drift.error.key
                : "networkError",
            )}
            onRetry={() => void drift.refetch()}
          />
        )}
        <div className="table-scroll">
          <table className="drift-table">
            <caption className="sr-only">{t("driftTitle")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("feature")}</th>
                <th scope="col">{t("ks")}</th>
                <th scope="col">{t("pValue")}</th>
                <th scope="col">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => {
                const detail =
                  report?.enough_data === false
                    ? undefined
                    : report?.features?.[f.key];
                const status = featureStatus(detail);
                return (
                  <tr key={f.key}>
                    <th scope="row">{c(f.key)}</th>
                    <td>{detail ? format.number(detail.ks, 4) : "—"}</td>
                    <td>{detail ? format.number(detail.p_value, 4) : "—"}</td>
                    <td>
                      <Badge
                        tone={
                          status === "drifted"
                            ? "danger"
                            : status === "warning"
                              ? "warning"
                              : status === "stable"
                                ? "success"
                                : "neutral"
                        }
                      >
                        {status === "stable" ? (
                          <CheckCircle2 size={13} />
                        ) : status === "unavailable" ? (
                          <Minus size={13} />
                        ) : (
                          <TriangleAlert size={13} />
                        )}{" "}
                        {t(status)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="drift-foot">
          <span>
            {report?.n_live !== undefined
              ? t("sampleCount", {
                  count: report.n_live,
                  formattedCount: format.number(report.n_live),
                })
              : c("unknown")}
          </span>
          <span>
            {c("lastChecked")}: {checked ? format.time(checked) : c("never")}
          </span>
        </div>
        <p className="drift-rule">{t("rule")}</p>
      </section>
    </div>
  );
}
