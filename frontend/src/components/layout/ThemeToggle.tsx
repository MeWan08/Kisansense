import { Sun, Moon, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme, type Theme } from "../../hooks/useTheme";
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <label className="select-control theme-control">
      <Icon size={17} />
      <span className="sr-only">{t("theme")}</span>
      <select
        aria-label={t("theme")}
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
      >
        {["system", "light", "dark"].map((v) => (
          <option key={v} value={v}>
            {t(v)}
          </option>
        ))}
      </select>
    </label>
  );
}
