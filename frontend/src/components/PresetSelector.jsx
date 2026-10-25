import { Check, Sparkles } from "lucide-react";
import { PRESETS } from "../data";
export default function PresetSelector({ values, onSelect, disabled }) {
  return (
    <section className="presets">
      <div className="section-kicker">
        <Sparkles size={14} /> A QUICK START{" "}
        <span>Explore a growing scenario</span>
      </div>
      <div className="preset-grid">
        {PRESETS.map((p) => {
          const selected = Object.keys(p.values).every(
            (k) => p.values[k] === values[k],
          );
          return (
            <button
              key={p.name}
              type="button"
              disabled={disabled}
              className={`preset ${selected ? "selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onSelect(p.values)}
            >
              <span className="preset-emoji">{p.icon}</span>
              <span>
                <strong>{p.name}</strong>
                <small>{p.region}</small>
              </span>
              {selected && <Check className="preset-check" size={13} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
