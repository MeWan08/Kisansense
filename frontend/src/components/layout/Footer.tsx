import { Leaf, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="site-footer">
      <div>
        <span className="footer-brand">
          <Leaf size={18} /> KisanSense
        </span>
        <p>{t("footer")}</p>
        <small>{t("advisory")}</small>
      </div>
      <div className="footer-links">
        <a
          href="https://github.com/MeWan08/Kisansense"
          target="_blank"
          rel="noreferrer"
        >
          {t("repository")}
          <ArrowUpRight size={14} />
        </a>
        <a
          href="https://github.com/MeWan08/Kisansense/blob/main/MODEL_CARD.md"
          target="_blank"
          rel="noreferrer"
        >
          {t("modelCard")}
          <ArrowUpRight size={14} />
        </a>
      </div>
    </footer>
  );
}
