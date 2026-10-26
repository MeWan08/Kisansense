import { Languages } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { locales, localeNames } from "../../lib/i18n";
import { writeStorage } from "../../lib/storage";
export function LanguageSwitcher() {
  const { locale = "en" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <label className="select-control">
      <Languages size={17} />
      <span className="sr-only">{t("language")}</span>
      <select
        aria-label={t("language")}
        value={locale}
        onChange={(e) => {
          const next = e.target.value;
          writeStorage("ks-locale", next);
          navigate(
            `/${next}${location.pathname.slice(locale.length + 1)}${location.search}${location.hash}`,
          );
        }}
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
