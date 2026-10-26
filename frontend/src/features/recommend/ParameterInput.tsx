import { Controller, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { fields, type Readings } from "../../lib/fields";
import { Input, Slider, Tooltip } from "../../components/ui";
import { useFormat } from "../../hooks/useFormat";
export function ParameterInput({
  definition: f,
  control,
  disabled,
}: {
  definition: (typeof fields)[number];
  control: Control<Readings>;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const { t: r } = useTranslation("recommend");
  const format = useFormat();
  return (
    <Controller
      name={f.key}
      control={control}
      render={({ field, fieldState }) => (
        <div className={`parameter ${fieldState.error ? "invalid" : ""}`}>
          <div className="parameter-label">
            <label htmlFor={`field-${f.key}`}>
              {t(f.key)}
              <span>{f.group === "soil" ? f.key : ""}</span>
            </label>
            {f.key === "ph" && (
              <Tooltip text={r("phHelp")}>
                <button
                  type="button"
                  className="help-button"
                  aria-label={r("phHelp")}
                >
                  <Info size={16} />
                </button>
              </Tooltip>
            )}
          </div>
          <div className="reading-input">
            <Input
              {...field}
              id={`field-${f.key}`}
              type="number"
              inputMode="decimal"
              min={f.min}
              max={f.max}
              step={f.step}
              disabled={disabled}
              value={Number.isFinite(field.value) ? field.value : ""}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? NaN : Number(e.target.value),
                )
              }
              aria-invalid={!!fieldState.error}
              aria-describedby={fieldState.error ? `error-${f.key}` : undefined}
            />
            <span>{t(f.unit)}</span>
          </div>
          <Slider
            label={t(f.key)}
            value={field.value}
            min={f.min}
            max={f.max}
            step={f.step}
            onChange={field.onChange}
            disabled={disabled}
          />
          <div className="range-labels">
            <span>{format.number(f.min, 1)}</span>
            <span>
              {format.number(f.max, 1)} {t(f.unit)}
            </span>
          </div>
          {fieldState.error && (
            <p id={`error-${f.key}`} role="alert" className="field-error">
              {t("rangeError", {
                min: format.number(f.min, 1),
                max: format.number(f.max, 1),
              })}
            </p>
          )}
        </div>
      )}
    />
  );
}
