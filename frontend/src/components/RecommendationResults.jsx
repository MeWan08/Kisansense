import { Sprout, ShieldAlert, Check, FlaskConical } from "lucide-react";
const icons = {
  rice: "🌾",
  coffee: "☕",
  grapes: "🍇",
  apple: "🍎",
  jute: "🌿",
  watermelon: "🍉",
  maize: "🌽",
  banana: "🍌",
  orange: "🍊",
  cotton: "☁️",
};
export default function RecommendationResults({
  result,
  demo,
  loading,
  stale,
}) {
  const top = result?.recommendations[0];
  return (
    <section className="results-panel" aria-busy={loading}>
      <div className="panel-heading">
        <span className="heading-icon">
          <Sprout size={19} />
        </span>
        <div>
          <h2>Your crop outlook</h2>
          <p>Intelligence for your next harvest</p>
        </div>
        <span className="tiny-label">AI POWERED</span>
      </div>
      <div aria-live="polite">
        {loading ? (
          <div className="empty-results">
            <div className="orb spinning">
              <Sprout size={38} />
            </div>
            <h3>Reading your growing conditions</h3>
            <p>Comparing your soil and climate profile with the crop model.</p>
            <div className="loading-track" />
          </div>
        ) : top ? (
          <>
            <div className="result-meta">
              <span>
                {demo ? "ILLUSTRATIVE DEMO RESULT" : "ANALYSIS COMPLETE"}
              </span>
              <span>
                <Check size={12} /> 7 parameters
              </span>
            </div>
            {stale && (
              <p className="stale-note">
                Inputs changed. Generate again to update these results.
              </p>
            )}
            <div className="primary-result">
              <div className="primary-top">
                <span className="pill">
                  <span /> PRIMARY RECOMMENDATION
                </span>
                <span className="rank">01</span>
              </div>
              <div className="crop-identity">
                <span className="crop-emoji">
                  {icons[top.crop.toLowerCase()] || "🌱"}
                </span>
                <div>
                  <h3>{top.crop}</h3>
                  <span className="suitability">
                    {top.confidence >= 0.8
                      ? "Strong model match"
                      : top.confidence >= 0.5
                        ? "Promising model match"
                        : "Needs expert review"}
                  </span>
                </div>
              </div>
              <div className="confidence-label">
                <span>Model confidence</span>
                <strong>
                  {(top.confidence * 100).toFixed(1)}
                  <small>%</small>
                </strong>
              </div>
              <div className="confidence-track">
                <span style={{ width: `${top.confidence * 100}%` }} />
              </div>
              <p className="result-caption">
                Based on the soil and climate parameters provided.
              </p>
            </div>
            <div className="alternatives-heading">
              ALTERNATIVE CROPS <span>Other potential matches</span>
            </div>
            {result.recommendations.slice(1).map((r, i) => (
              <div className="alternative" key={r.crop}>
                <span className="alt-rank">0{i + 2}</span>
                <span className="alt-emoji">
                  {icons[r.crop.toLowerCase()] || "🌱"}
                </span>
                <div className="alt-name">
                  <strong>{r.crop}</strong>
                  <div className="alt-track">
                    <span style={{ width: `${r.confidence * 100}%` }} />
                  </div>
                </div>
                <strong className="alt-confidence">
                  {(r.confidence * 100).toFixed(1)}
                  <small>%</small>
                </strong>
              </div>
            ))}
            {(result.advice || top.confidence < 0.5) && (
              <div className="warning" role="alert">
                <ShieldAlert size={21} />
                <div>
                  <strong>Low confidence prediction</strong>
                  <p>
                    {result.advice ||
                      "Please consult your district agriculture officer."}
                  </p>
                </div>
              </div>
            )}
            <div className="analysis-foot">
              <span>Model: {result.model_version}</span>
              <span>Top 3 recommendations</span>
            </div>
          </>
        ) : (
          <div className="empty-results">
            <div className="orb">
              <Sprout size={42} />
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
            </div>
            <span className="eyebrow">BETTER INPUTS. BETTER DECISIONS.</span>
            <h3>
              Your next harvest
              <br />
              starts with insight.
            </h3>
            <p>
              Set your growing conditions and let KisanSense find the crops that
              fit.
            </p>
            <div className="empty-steps">
              <span>
                01 <b>Add field data</b>
              </span>
              <i />
              <span>
                02 <b>Discover crops</b>
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="responsible-note">
        <FlaskConical size={17} />
        <p>
          {demo
            ? "Demo predictions are illustrative and generated locally. Connect your API for real model recommendations."
            : "AI supports your expertise. Consider local conditions and consult an agronomist before planting."}
        </p>
      </div>
    </section>
  );
}
