import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import "./PublicStatus.css";

const STATUS_COPY = {
  complete: "Done",
  current: "In progress",
  upcoming: "Waiting",
};

const PublicStatus = () => {
  const { reference: routeReference = "" } = useParams();
  const [reference, setReference] = useState(decodeURIComponent(routeReference).toUpperCase());
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(Boolean(routeReference));
  const [error, setError] = useState("");

  const lookup = async (event) => {
    event?.preventDefault();
    const value = reference.trim().toUpperCase();
    if (!value) {
      setError("Enter a reference number to check its progress.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/public/status/${encodeURIComponent(value)}`);
      setRecord(response.data.data);
    } catch (err) {
      setRecord(null);
      setError(err.response?.data?.message || "We could not find that reference number.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeReference) lookup();
  }, [routeReference]);

  useEffect(() => {
    if (!routeReference) return undefined;
    const timer = setInterval(() => lookup(), 15000);
    return () => clearInterval(timer);
  }, [routeReference, reference]);

  return (
    <main className="public-status-page">
      <section className="public-status-shell">
        <div className="public-status-brand">
          <span className="public-status-sparkle">✦</span>
          <span>PPST E-Portal</span>
        </div>
        <p className="public-status-kicker">Application progress</p>
        <h1>Follow your form’s journey</h1>
        <p className="public-status-intro">
          Scan the QR code on your printed form, or enter its reference number below.
          No sign-in is needed.
        </p>

        <form className="public-status-search" onSubmit={lookup}>
          <label htmlFor="reference">Reference number</label>
          <div className="public-status-search-row">
            <input
              id="reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="PPST/AKD-01/2026/0001"
              autoCapitalize="characters"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Checking…" : "Check status"}
            </button>
          </div>
        </form>

        {error && <p className="public-status-error">{error}</p>}

        {record && (
          <section className="public-status-card" aria-live="polite">
            <div className="public-status-card-head">
              <div>
                <span className="public-status-label">Reference number</span>
                <strong>{record.reference_no}</strong>
                <h2>{record.form_label}</h2>
              </div>
              <StatusBadge status={record.status} />
            </div>

            <div className="public-status-track">
              {record.stages.map((stage) => (
                <div className={`public-status-stage ${stage.state}`} key={stage.key}>
                  <span className="public-status-dot">{stage.state === "complete" ? "✓" : "•"}</span>
                  <div>
                    <strong>{stage.label}</strong>
                    <span>{STATUS_COPY[stage.state]}</span>
                    {stage.date && (
                      <time dateTime={stage.date}>
                        {new Date(stage.date).toLocaleDateString("en-MY", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </time>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="public-status-note">
              This page shows workflow progress only. For questions about your application,
              please contact PPST.
            </p>
          </section>
        )}
      </section>
    </main>
  );
};

export default PublicStatus;
