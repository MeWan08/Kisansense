import {
  ShieldCheck,
  BookOpen,
  Database,
  Activity,
  TriangleAlert,
  Languages,
  ArrowUpRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
export default function DocsPage() {
  const { t } = useTranslation("docs");
  const { t: c } = useTranslation();
  return (
    <div className="page-section docs-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
      </div>
      <div className="docs-layout">
        <aside>
          <BookOpen size={25} />
          <a
            href="https://github.com/MeWan08/Kisansense/blob/main/MODEL_CARD.md"
            target="_blank"
            rel="noreferrer"
          >
            {c("modelCard")}
            <ArrowUpRight size={17} />
          </a>
          <a
            href="https://github.com/MeWan08/Kisansense"
            target="_blank"
            rel="noreferrer"
          >
            {c("repository")}
            <ArrowUpRight size={17} />
          </a>
        </aside>
        <div className="docs-content">
          {[
            ["method", ShieldCheck],
            ["data", Database],
            ["limits", TriangleAlert],
            ["monitor", Activity],
            ["use", BookOpen],
            ["review", Languages],
          ].map(([key, Icon]) => {
            const SectionIcon = Icon as typeof BookOpen;
            return (
              <section key={String(key)}>
                <h2>
                  <SectionIcon size={22} />
                  {t(`${key}Title`)}
                </h2>
                <p>{t(`${key}Body`)}</p>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
