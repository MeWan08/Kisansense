import { useTranslation } from "react-i18next";
import { Wheat, Coffee, Grape, Apple, Check } from "lucide-react";
import { presets, type Readings } from "../../lib/fields";
export function PresetSelector({
  values,
  onSelect,
  disabled,
}: {
  values: Readings;
  onSelect: (v: Readings) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation("recommend");
  const icons = [Wheat, Coffee, Grape, Apple];
  return (
    <section className="preset-section">
      <p className="section-label">{t("presets")}</p>
      <div className="preset-list">
        {presets.map((p, i) => {
          const Icon = icons[i];
          const active =
            JSON.stringify(values) === JSON.stringify(p.values) ||
            Object.entries(p.values).every(
              ([key, value]) => values[key as keyof Readings] === value,
            );
          return (
            <button
              className={`preset-button ${active ? "selected" : ""}`}
              key={p.id}
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onSelect({ ...p.values })}
              type="button"
            >
              <Icon size={19} />
              <span>{t(p.id)}</span>
              {active && <Check size={15} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
