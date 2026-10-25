import { Leaf, Settings2, ArrowUpRight } from "lucide-react";
export default function Header({ health, demo, onSettings }) {
  return (
    <header className="header">
      <a className="brand" href="#">
        <span className="brand-icon">
          <Leaf size={24} />
        </span>
        <span>
          Kisan<span className="brand-light">Sense</span>
          <small>AI PRECISION AGRONOMY</small>
        </span>
      </a>
      <nav aria-label="Main navigation">
        <a className="nav-active" href="#workspace">
          Crop advisory
        </a>
        <a
          href="https://github.com/MeWan08/Kisansense"
          target="_blank"
          rel="noreferrer"
        >
          Documentation <ArrowUpRight size={13} />
        </a>
      </nav>
      <div className="header-actions">
        <span className={`status ${demo ? "demo" : health.status}`}>
          <i />
          {demo
            ? "Demo workspace"
            : health.status === "live"
              ? "System live"
              : health.status === "checking"
                ? "Connecting"
                : "API offline"}
        </span>
        <button
          className="icon-button"
          aria-label="Connection settings"
          onClick={onSettings}
        >
          <Settings2 size={19} />
        </button>
      </div>
    </header>
  );
}
