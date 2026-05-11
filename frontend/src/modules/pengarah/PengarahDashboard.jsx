// =============================================================
// src/modules/pengarah/PengarahDashboard.jsx
// System-wide overview + pending approvals queue
// =============================================================
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import StatusBadge, { FORM_LABELS } from "../../components/StatusBadge";
import "./PengarahDashboard.css";

const FORM_COLORS = {
  sick_leave:"#dc2626", non_sick_leave:"#d97706", appeal_review:"#2563eb",
  withdrawal:"#7c3aed", exam_replacement:"#059669", room_booking:"#0891b2",
};

const PengarahDashboard = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const canvasRef = useRef(null);

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, analyticsRes] = await Promise.all([
          api.get("/pengarah/dashboard"),
          api.get("/pengarah/analytics"),
        ]);
        setData({ ...dashRes.data.data, analytics: analyticsRes.data.data });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Draw donut chart — by status
  useEffect(() => {
    if (!data?.analytics?.byStatus?.length || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const items  = data.analytics.byStatus;
    const total  = items.reduce((s, i) => s + Number(i.count), 0);
    if (!total) return;

    const STATUS_COLORS = {
      pending_admin:    "#b45309",
      pending_pengarah: "#1e40af",
      fully_approved:   "#065f46",
      rejected:         "#991b1b",
    };

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const R  = Math.min(cx, cy) - 20;
    const r  = R * 0.55;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let startAngle = -Math.PI / 2;
    items.forEach((item) => {
      const slice = (Number(item.count) / total) * 2 * Math.PI;
      const color = STATUS_COLORS[item.status] || "#8a93a8";

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.shadowColor = color + "55"; ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Gap
      startAngle += slice + 0.02;
    });

    // Inner hole
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Centre text
    ctx.fillStyle = "#1a2340";
    ctx.font = `bold 22px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total, cx, cy - 8);
    ctx.fillStyle = "#8a93a8";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("Total", cx, cy + 12);
  }, [data]);

  if (loading) return <div className="pen-state"><div className="loading-spinner" />Loading…</div>;
  if (error)   return <div className="pen-state error">{error}</div>;

  const stats   = data?.stats   || {};
  const pending = data?.pending || [];
  const recent  = data?.recentDecisions || [];

  return (
    <div className="pengarah-dashboard">
      {/* Header */}
      <div className="pen-header">
        <div>
          <h1 className="pen-title">Pengarah Dashboard</h1>
          <p className="pen-subtitle">
            Welcome, <strong>{user?.name}</strong> · Director, PPST UMS
          </p>
        </div>
        <button className="pen-btn primary" onClick={() => navigate("/pengarah/approvals")}>
          ✍️ View Pending Approvals
          {stats.pending_pengarah > 0 && (
            <span className="pen-badge">{stats.pending_pengarah}</span>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="pen-stats-grid">
        {[
          { label:"Total Applications",  value: stats.total            || 0, icon:"📋", color:"#003087", bg:"#eef2fb" },
          { label:"Awaiting My Approval",value: stats.pending_pengarah || 0, icon:"✍️", color:"#5b21b6", bg:"#ede9fe", urgent: true },
          { label:"Fully Approved",      value: stats.fully_approved   || 0, icon:"✅", color:"#065f46", bg:"#d1fae5" },
          { label:"Rejected",            value: stats.rejected         || 0, icon:"❌", color:"#991b1b", bg:"#fee2e2" },
          { label:"With Admin",          value: stats.pending_admin    || 0, icon:"⏳", color:"#b45309", bg:"#fef3c7" },
        ].map((s) => (
          <div
            key={s.label}
            className={`pen-stat-card ${s.urgent && s.value > 0 ? "urgent" : ""}`}
            style={{ "--sc": s.color, "--sb": s.bg }}
            onClick={() => s.urgent && navigate("/pengarah/approvals")}
          >
            <div className="psc-icon">{s.icon}</div>
            <div className="psc-value">{s.value}</div>
            <div className="psc-label">{s.label}</div>
            {s.urgent && s.value > 0 && <span className="psc-urgent">Action Needed</span>}
          </div>
        ))}
      </div>

      {/* Two-col */}
      <div className="pen-two-col">
        {/* Donut chart */}
        <div className="pen-card">
          <div className="pen-card-header">
            <h3 className="pen-card-title">📊 System Overview by Status</h3>
          </div>
          <div className="donut-wrap">
            <canvas ref={canvasRef} width={200} height={200} className="donut-canvas" />
            <div className="donut-legend">
              {(data?.analytics?.byStatus || []).map((item) => (
                <div key={item.status} className="donut-legend-item">
                  <span className="dl-dot" style={{
                    background: {
                      pending_admin:"#b45309", pending_pengarah:"#1e40af",
                      fully_approved:"#065f46", rejected:"#991b1b"
                    }[item.status] || "#8a93a8"
                  }} />
                  <span className="dl-label">
                    {item.status.replace(/_/g," ").replace(/\b\w/g, c=>c.toUpperCase())}
                  </span>
                  <span className="dl-count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending queue */}
        <div className="pen-card">
          <div className="pen-card-header">
            <h3 className="pen-card-title">⏳ Awaiting Your Signature</h3>
            <button className="pen-card-link" onClick={() => navigate("/pengarah/approvals")}>
              View All →
            </button>
          </div>
          {pending.length === 0 ? (
            <div className="pen-empty">
              <span>🎉</span>
              <p>No applications pending — you're all caught up!</p>
            </div>
          ) : (
            <div className="pen-pending-list">
              {pending.map((app) => (
                <div
                  key={app.id}
                  className="pen-pending-item"
                  onClick={() => navigate(`/pengarah/approvals/${app.id}`)}
                >
                  <div className="ppi-left">
                    <span className="ppi-id">#{app.id}</span>
                    <div className="ppi-info">
                      <span className="ppi-name">{app.student_name}</span>
                      <span className="ppi-meta">
                        {app.student_matric} · {app.program || "—"}
                      </span>
                    </div>
                  </div>
                  <div className="ppi-right">
                    <span className="ppi-type" style={{ color: FORM_COLORS[app.form_type] }}>
                      {FORM_LABELS[app.form_type]}
                    </span>
                    <span className="ppi-admin">✓ Admin: {app.admin_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Decisions */}
      {recent.length > 0 && (
        <div className="pen-card pen-full-card">
          <div className="pen-card-header">
            <h3 className="pen-card-title">🕐 My Recent Decisions</h3>
          </div>
          <table className="pen-table">
            <thead>
              <tr><th>App ID</th><th>Student</th><th>Form Type</th><th>Decision</th><th>Date</th><th>Comment</th></tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/pengarah/approvals/${r.id}`)} className="pen-tr">
                  <td className="pen-id">#{r.id}</td>
                  <td>
                    <div className="pen-student">
                      <span className="pen-sname">{r.student_name}</span>
                      <span className="pen-smatric">{r.student_matric}</span>
                    </div>
                  </td>
                  <td className="pen-ftype">{FORM_LABELS[r.form_type]}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="pen-date">
                    {r.pengarah_approved_at
                      ? new Date(r.pengarah_approved_at).toLocaleDateString("en-MY", { day:"2-digit", month:"short", year:"numeric" })
                      : "—"}
                  </td>
                  <td className="pen-comment">{r.pengarah_comment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PengarahDashboard;
