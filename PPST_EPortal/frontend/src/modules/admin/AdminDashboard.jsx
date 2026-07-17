// =============================================================
// src/modules/admin/AdminDashboard.jsx
// Stats overview + form-type bar chart + recent pending table
// =============================================================
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import StatusBadge, { FORM_LABELS } from "../../components/StatusBadge";
import "./AdminDashboard.css";

// Chart.js loaded via CDN in index.html — accessed via window.Chart
// We'll use a lightweight inline canvas renderer to avoid a dep.

const FORM_COLORS = {
  sick_leave:       "#dc2626",
  non_sick_leave:   "#d97706",
  appeal_review:    "#2563eb",
  withdrawal:       "#7c3aed",
  exam_replacement: "#059669",
  room_booking:     "#0891b2",
};

const AdminDashboard = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const [dashData, setDashData]   = useState(null);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState("");

  useEffect(() => {
    const fetchDash = async () => {
      try {
        const [dashRes, analyticsRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/analytics"),
        ]);
        setDashData({
          ...dashRes.data.data,
          analytics: analyticsRes.data.data,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchDash();
  }, []);

  // Draw bar chart with native Canvas API (no extra deps)
  useEffect(() => {
    if (!dashData?.analytics?.byType || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const data   = dashData.analytics.byType;

    const W    = canvas.width;
    const H    = canvas.height;
    const PAD  = 40;
    const maxV = Math.max(...data.map((d) => d.count), 1);
    const barW = Math.floor((W - PAD * 2) / data.length) - 8;

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "#f0f2f8";
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD + ((H - PAD * 2) / 4) * i;
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(W - PAD, y);
      ctx.stroke();
      // Y labels
      ctx.fillStyle  = "#8a93a8";
      ctx.font       = "10px Inter, sans-serif";
      ctx.textAlign  = "right";
      ctx.fillText(Math.round(maxV - (maxV / 4) * i), PAD - 6, y + 4);
    }

    // Bars
    data.forEach((d, i) => {
      const barH = ((d.count / maxV) * (H - PAD * 2));
      const x    = PAD + i * (barW + 8);
      const y    = H - PAD - barH;
      const color = FORM_COLORS[d.form_type] || "#003087";

      // Bar shadow
      ctx.shadowColor  = color + "44";
      ctx.shadowBlur   = 8;
      ctx.shadowOffsetY = 3;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.shadowBlur  = 0;

      // Count label on top
      ctx.fillStyle  = color;
      ctx.font       = "bold 11px Inter, sans-serif";
      ctx.textAlign  = "center";
      ctx.fillText(d.count, x + barW / 2, y - 5);

      // X-axis label (short code)
      const shortLabel = d.form_type.replace("_", " ").replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()).split(" ")[0];
      ctx.fillStyle  = "#8a93a8";
      ctx.font       = "9px Inter, sans-serif";
      ctx.textAlign  = "center";
      ctx.fillText(shortLabel, x + barW / 2, H - PAD + 12);
    });
  }, [dashData]);

  const stats  = dashData?.stats  || {};
  const recent = dashData?.recent || [];

  if (loading) return <div className="admin-loading"><div className="loading-spinner" />Loading dashboard…</div>;
  if (error)   return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      {/* ---- Header ---- */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            Admin Dashboard
          </h1>
          <p className="admin-page-subtitle">
            Welcome, <strong>{user?.name}</strong> · {new Date().toLocaleDateString("en-MY", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <button className="admin-view-all-btn" onClick={() => navigate("/admin/applications")}>
          View All Applications →
        </button>
      </div>

      {/* ---- Stats Cards ---- */}
      <div className="admin-stats-grid">
        {[
          { label: "Total Applications",  value: stats.total            || 0, color: "#003087", bg: "#eef2fb", icon: "📋" },
          { label: "Pending My Review",   value: stats.pending_admin    || 0, color: "#b45309", bg: "#fef3c7", icon: "⏳", urgent: true },
          { label: "With Pengarah",       value: stats.pending_pengarah || 0, color: "#1e40af", bg: "#dbeafe", icon: "📤" },
          { label: "Fully Approved",      value: stats.fully_approved   || 0, color: "#065f46", bg: "#d1fae5", icon: "✅" },
          { label: "Rejected",            value: stats.rejected         || 0, color: "#991b1b", bg: "#fee2e2", icon: "❌" },
        ].map((s) => (
          <div
            key={s.label}
            className={`admin-stat-card ${s.urgent && s.value > 0 ? "urgent" : ""}`}
            style={{ "--sc": s.color, "--sb": s.bg }}
            onClick={() => s.urgent && navigate("/admin/applications?status=pending_admin")}
          >
            <div className="asc-icon">{s.icon}</div>
            <div className="asc-value">{s.value}</div>
            <div className="asc-label">{s.label}</div>
            {s.urgent && s.value > 0 && (
              <div className="asc-urgent-tag">Needs Action</div>
            )}
          </div>
        ))}
      </div>

      {/* ---- Two-column: Chart + Recent ---- */}
      <div className="admin-two-col">

        {/* Bar Chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">📊 Applications by Form Type</h3>
          </div>
          <div className="chart-wrap">
            <canvas ref={canvasRef} width={480} height={220} className="bar-chart" />
          </div>
          {/* Legend */}
          <div className="chart-legend">
            {Object.entries(FORM_LABELS).map(([key, label]) => (
              <div key={key} className="legend-item">
                <span className="legend-dot" style={{ background: FORM_COLORS[key] }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Pending */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">⏳ Oldest Pending (Needs Review)</h3>
            <button className="card-link-btn" onClick={() => navigate("/admin/applications?status=pending_admin")}>
              View All →
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="admin-empty">
              <span>🎉</span>
              <p>No pending applications! You're all caught up.</p>
            </div>
          ) : (
            <div className="pending-list">
              {recent.map((app) => (
                <div
                  key={app.id}
                  className="pending-item"
                  onClick={() => navigate(`/admin/applications/${app.id}`)}
                >
                  <div className="pi-left">
                    <span className="pi-id">#{app.id}</span>
                    <div className="pi-info">
                      <span className="pi-student">{app.student_name}</span>
                      <span className="pi-meta">{app.student_matric} · {app.program || "—"}</span>
                    </div>
                  </div>
                  <div className="pi-right">
                    <span
                      className="pi-type"
                      style={{ color: FORM_COLORS[app.form_type] || "#003087" }}
                    >
                      {FORM_LABELS[app.form_type]}
                    </span>
                    <span className="pi-date">
                      {new Date(app.submitted_at).toLocaleDateString("en-MY", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
