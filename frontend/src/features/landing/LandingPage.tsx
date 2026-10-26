import { motion, useReducedMotion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  ArrowUpRight,
  Layers3,
  CloudSun,
  Sprout,
  ShieldCheck,
  Leaf,
} from "lucide-react";
import { motionTiming } from "../../lib/motion";
import { useFormat } from "../../hooks/useFormat";
export default function LandingPage() {
  const { t } = useTranslation("landing");
  const { t: c } = useTranslation();
  const { locale } = useParams();
  const reduced = useReducedMotion();
  const format = useFormat();
  return (
    <div className="landing">
      <section className="hero">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionTiming}
        >
          <div className="eyebrow">
            <span className="small-line" />
            {t("eyebrow")}
          </div>
          <h1>{t("title")}</h1>
          <p className="hero-intro">{t("intro")}</p>
          <div className="hero-actions">
            <Link className="button button-primary" to={`/${locale}/recommend`}>
              {c("start")}
              <ArrowRight size={18} />
            </Link>
            <Link className="text-link" to={`/${locale}/crops`}>
              {t("explore")}
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <p className="hero-footnote">
            <ShieldCheck size={16} />
            {t("free")}
          </p>
        </motion.div>
        <div className="field-art">
          <div className="art-heading">
            <span className="eyebrow">{t("fieldLabel")}</span>
            <span className="art-cross">+</span>
          </div>
          <svg viewBox="0 0 480 340" className="field-map" aria-hidden="true">
            <defs>
              <pattern
                id="rows-a"
                width="15"
                height="15"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(-25)"
              >
                <path d="M0 0V15" stroke="currentColor" strokeWidth="2" />
              </pattern>
              <pattern
                id="rows-b"
                width="11"
                height="11"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(35)"
              >
                <path d="M0 0V11" stroke="currentColor" strokeWidth="1.5" />
              </pattern>
            </defs>
            <path d="M48 170L247 55 439 168 239 286Z" className="map-ground" />
            <path d="M48 170L239 286V304L48 188Z" className="map-side" />
            <path d="M239 286L439 168V187L239 304Z" className="map-edge" />
            <g className="map-fields">
              <path d="M65 168L159 115 239 161 146 216Z" fill="url(#rows-a)" />
              <path d="M174 106L247 65 327 112 254 153Z" fill="url(#rows-b)" />
              <path d="M160 224L253 170 327 215 239 268Z" fill="url(#rows-b)" />
              <path d="M270 161L343 120 422 167 342 207Z" fill="url(#rows-a)" />
            </g>
            <path
              d="M146 109L347 225M246 157L161 224M254 158L337 112"
              stroke="var(--map-path)"
              strokeWidth="5"
              fill="none"
            />
            <circle cx="255" cy="157" r="8" fill="var(--map-pin)" />
            <circle
              cx="255"
              cy="157"
              r="17"
              fill="none"
              stroke="var(--map-pin)"
              opacity=".3"
            />
            <path
              d="M255 139V95"
              stroke="var(--map-pin)"
              strokeDasharray="3 5"
            />
          </svg>
          <div className="map-key">
            <span>
              <Layers3 size={15} />
              {c("N")} · {c("P")} · {c("K")}
            </span>
            <span>
              <CloudSun size={16} />
              {c("temperature")}
            </span>
          </div>
          <div className="art-caption">
            <Leaf size={23} />
            <div>
              <strong>{t("fieldTitle")}</strong>
              <p>{t("fieldCaption")}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="metric-strip" aria-label={t("fieldLabel")}>
        {[
          [22, "cropCount"],
          [7, "inputCount"],
          [3, "languages"],
        ].map(([n, key]) => (
          <div key={key}>
            <strong>
              {format.number(Number(n))}
              <span> / </span>
            </strong>
            <p>{t(String(key))}</p>
          </div>
        ))}
      </section>
      <section className="process-section">
        <div className="section-intro">
          <span className="eyebrow">{t("processLabel")}</span>
          <h2>{t("processTitle")}</h2>
        </div>
        <div className="steps">
          {[Layers3, CloudSun, Sprout].map((Icon, i) => (
            <motion.article
              key={i}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...motionTiming, delay: reduced ? 0 : i * 0.07 }}
            >
              <div className="step-top">
                <Icon size={24} />
                <span>
                  {format.number(i + 1).padStart(2, format.number(0))}
                </span>
              </div>
              <h3>{t(`step${i + 1}Title`)}</h3>
              <p>{t(`step${i + 1}Body`)}</p>
            </motion.article>
          ))}
        </div>
      </section>
      <section className="trust-section">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={15} /> KISANSENSE
          </span>
          <h2>{t("trustTitle")}</h2>
          <p>{t("trustBody")}</p>
          <Link className="text-link" to={`/${locale}/about`}>
            {t("trustLink")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="benchmark">
          <strong>{format.percent(0.9697)}</strong>
          <span>{t("benchmark")}</span>
          <a
            href="https://github.com/MeWan08/Kisansense/blob/main/metrics.json"
            target="_blank"
            rel="noreferrer"
          >
            metrics.json <ArrowUpRight size={14} />
          </a>
        </div>
      </section>
    </div>
  );
}
