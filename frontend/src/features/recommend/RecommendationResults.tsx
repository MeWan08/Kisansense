import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Sprout,
  Wheat,
  Leaf,
  ShieldAlert,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Badge, Skeleton, Tooltip } from "../../components/ui";
import type { Prediction } from "../../lib/api/schemas";
import { LOW_CONFIDENCE, STRONG_CONFIDENCE } from "../../lib/fields";
import { useFormat } from "../../hooks/useFormat";
import { motionTiming } from "../../lib/motion";
export function RecommendationResults({
  result,
  loading,
  stale,
  latency,
}: {
  result?: Prediction;
  loading: boolean;
  stale: boolean;
  latency?: number;
}) {
  const { t } = useTranslation("recommend");
  const { t: c } = useTranslation();
  const { t: crop } = useTranslation("crops");
  const format = useFormat();
  const reduced = useReducedMotion();
  const top = result?.recommendations[0];
  const animatedConfidence = useAnimatedNumber(top?.confidence ?? 0);
  const warning =
    !!result?.advice || (!!top && top.confidence < LOW_CONFIDENCE);
  return (
    <section className="result-panel" aria-live="polite" aria-busy={loading}>
      <div className="result-heading">
        <Sprout size={20} />
        <h2>{t("resultTitle")}</h2>
      </div>
      {loading ? (
        <div className="result-loading">
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <p>{t("working")}</p>
        </div>
      ) : top && result ? (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionTiming}
        >
          {stale && (
            <div className="notice notice-warning text-sm">
              <Info size={18} />
              {t("stale")}
            </div>
          )}
          <div className="primary-result">
            <div className="result-overline">
              <span>{t("primary")}</span>
              <CheckCircle2 size={17} />
            </div>
            <div className="result-crop">
              <span className="crop-symbol">
                <Wheat size={34} />
              </span>
              <h3>{crop(top.crop)}</h3>
            </div>
            <Badge tone={warning ? "warning" : "success"}>
              {t(
                warning
                  ? "low"
                  : top.confidence >= STRONG_CONFIDENCE
                    ? "strong"
                    : "moderate",
              )}
            </Badge>
            <div className="confidence-heading">
              <span>
                {t("confidence")}
                <Tooltip text={t("confidenceHelp")}>
                  <button
                    className="help-button"
                    type="button"
                    aria-label={t("confidenceHelp")}
                  >
                    <Info size={15} />
                  </button>
                </Tooltip>
              </span>
              <strong>{format.percent(animatedConfidence)}</strong>
            </div>
            <div
              className="confidence-track"
              role="meter"
              aria-label={t("confidence")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={top.confidence * 100}
            >
              <motion.div
                initial={reduced ? false : { scaleX: 0 }}
                animate={{ scaleX: top.confidence }}
                transition={{ ...motionTiming, duration: 0.4 }}
              />
            </div>
          </div>
          <div className="alternatives">
            <p className="section-label">{t("alternatives")}</p>
            {result.recommendations.slice(1).map((r, i) => (
              <div className="alternative" key={r.crop}>
                <span className="rank">
                  {format.number(i + 2).padStart(2, format.number(0))}
                </span>
                <Leaf size={20} />
                <strong>{crop(r.crop)}</strong>
                <span>{format.percent(r.confidence)}</span>
              </div>
            ))}
          </div>
          {warning && (
            <div className="notice notice-warning">
              <ShieldAlert size={22} />
              <div>
                <strong>{t("low")}</strong>
                <p>{t("lowBody")}</p>
              </div>
            </div>
          )}
          <dl className="result-details">
            <div>
              <dt>{t("model")}</dt>
              <dd>{result.model_version}</dd>
            </div>
            <div>
              <dt>{t("latency")}</dt>
              <dd>
                {latency !== undefined ? format.number(latency) : "—"} {c("ms")}
              </dd>
            </div>
          </dl>
        </motion.div>
      ) : (
        <div className="result-empty">
          <div className="empty-sprout">
            <Sprout size={42} />
          </div>
          <h3>{t("emptyTitle")}</h3>
          <p>{t("emptyBody")}</p>
          <div className="empty-guide">
            <span>01</span>
            <i />
            <span>02</span>
            <i />
            <span>03</span>
          </div>
        </div>
      )}
      <p className="advisory-note">
        <ShieldAlert size={16} />
        {c("advisory")}
      </p>
    </section>
  );
}
