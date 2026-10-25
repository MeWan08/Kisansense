import { Activity, CircleHelp, ShieldCheck, ShieldAlert } from "lucide-react";
export default function DriftTelemetryPill({ drift, demo }) {
  const waiting = !drift || drift.enough_data === false;
  const Icon = waiting ? CircleHelp : drift.drift ? ShieldAlert : ShieldCheck;
  const title = demo
    ? "Simulated telemetry"
    : !drift
      ? "Drift status unavailable"
      : drift.enough_data === false
        ? "Collecting baseline samples"
        : drift.drift
          ? "Environmental drift detected"
          : "Distribution nominal";
  return (
    <div
      className={`drift-pill ${demo || waiting ? "neutral" : drift.drift ? "danger" : "good"}`}
    >
      <Icon size={17} />
      <div>
        <strong>{title}</strong>
        <small>
          {demo
            ? "Demo mode · no live monitoring"
            : drift?.drift
              ? `Affected: ${drift.drifted_features.join(", ") || "see drift report"}`
              : drift?.enough_data === false
                ? `${drift.n_live || 0} observations · awaiting sufficient data`
                : "Kolmogorov–Smirnov drift monitor"}
        </small>
      </div>
      <Activity size={26} className="drift-wave" />
    </div>
  );
}
