import { Droplets, Thermometer, CloudRain } from "lucide-react";
export default function ParameterInput({
  parameter: p,
  value,
  onChange,
  error,
  disabled,
}) {
  const Icon = { temp: Thermometer, humidity: Droplets, rain: CloudRain }[
    p.symbol
  ];
  const percent = Math.min(
    100,
    Math.max(0, ((Number(value) - p.min) / (p.max - p.min)) * 100),
  );
  return (
    <div className={`parameter ${error ? "invalid" : ""}`}>
      <div className="parameter-top">
        <label htmlFor={`${p.key}-number`}>
          <span className={`parameter-symbol ${p.group}`}>
            {Icon ? <Icon size={16} /> : p.symbol}
          </span>
          {p.name}
        </label>
        <div className="number-wrap">
          <input
            id={`${p.key}-number`}
            type="number"
            min={p.min}
            max={p.max}
            step={p.step}
            value={value}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${p.key}-error` : undefined}
            onChange={(e) =>
              onChange(
                p.key,
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
          />
          <span>{p.unit}</span>
        </div>
      </div>
      <input
        type="range"
        aria-label={`${p.name} slider`}
        min={p.min}
        max={p.max}
        step={p.step}
        value={value === "" ? p.min : value}
        disabled={disabled}
        style={{ "--progress": `${percent}%` }}
        onChange={(e) => onChange(p.key, Number(e.target.value))}
      />
      <div className="range-labels">
        <span>
          {p.min} {p.unit}
        </span>
        <span>
          {p.max} {p.unit}
        </span>
      </div>
      {error && (
        <p className="field-error" id={`${p.key}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
