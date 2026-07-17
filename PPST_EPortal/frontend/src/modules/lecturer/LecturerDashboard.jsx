// =============================================================
// src/modules/lecturer/LecturerDashboard.jsx
// Overview: stat cards, group bar chart, recent leave list
// =============================================================
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import StatusBadge, { FORM_LABELS } from "../../components/StatusBadge";
import "./LecturerDashboard.css";

const LecturerDashboard = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const canvasRef  = useRef(null);

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, statsRes] = await Promise.all([
          api.get("/lecturer/dashboard"),
          api.get("/lecturer/stats"),
        ]);
        setData({
          ...dashRes.data.data,
          stats: statsRes.data.data,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Draw stacked bar chart — absences by group
  useEffect(() => {
    if (!data?.stats?.byGroup?.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const groups = data.stats.byGroup;

    const W   = canvas.width;
    const H   = canvas.height;
    const PAD = { top: 20, right: 20, bottom: 40, left: 35 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top  - PAD.bottom;

    const maxV  = Math.max(...groups.map((g) => Number(g.sick) + Number(g.non_sick)), 1);
    const barW  = Math.floor(chartW / groups.length) - 12;

    ctx.clearRect(0, 0, W, H);

    // Grid
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (chartH / 4) * i;
      ctx.strokeStyle = "#f0f2f8";
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
      ctx.fillStyle = "#b8bfcc";
      ctx.font      = "10px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(Math.round(maxV - (maxV / 4) * i), PAD.left - 5, y + 4);
    }

    groups.forEach((g, i) => {
      const sick    = Number(g.sick);
      const nonSick = Number(g.non_sick);
      const total   = sick + nonSick;
      const x       = PAD.left + i * (barW + 12);

      // Non-sick (bottom layer — amber)
      if (nonSick > 0) {
        const bH = (nonSick / maxV) * chartH;
        const by = PAD.top + chartH - bH;
        ctx.fillStyle = "#d97706";
        ctx.shadowColor = "#d9770633"; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.roundRect(x, by, barW, bH, nonSick === total ? [4,4,0,0] : 0); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Sick (top layer — red)
      if (sick > 0) {
        const bH = (sick / maxV) * chartH;
        const by = PAD.top + chartH - ((sick + nonSick) / maxV) * chartH;
        ctx.fillStyle = "#dc2626";
        ctx.shadowColor = "#dc262633"; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.roundRect(x, by, barW, bH, [4, 4, 0, 0]); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Total label
      if (total > 0) {
        const topY = PAD.top + chartH - (total / maxV) * chartH - 6;
        ctx.fillStyle = "#1a2340"; ctx.font = "bold 10px Inter, sans-serif"; ctx.textAlign = "center";
        ctx.fillText(total, x + barW / 2, topY);
      }

      // X label
      ctx.fillStyle = "#8a93a8"; ctx.font = "10px Inter, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(g.grp || "—", x + barW / 2, H - PAD.bottom + 14);
    });
  }, [data]);

  if (loading) return <div className="lec-state"><div className="loading-spinner" /> Loading…</div>;
  if (error)   return <div className="lec-state error">{error}</div>;

  const s = data?.overview || data;
  const stats = s?.stats || {};
  const recentLeave = data?.recentLeave || [];
  const perGroup    = data?.perGroup    || [];

  return (
    <div className="lecturer-dashboard">
      {/* Header */}
      <div className="lec-header">
        <div>
          <h1 className="lec-title">Lecturer Dashboard</h1>
          <p className="lec-subtitle">
            Welcome, <strong>{user?.name}</strong> ·{" "}
            {new Date().toLocaleDateString("en-MY", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
          </p>
        </div>
        <div className="lec-header-actions">
          <button className="lec-btn secondary" onClick={() => navigate("/lecturer/attendance")}>
            📋 Attendance Records
          </button>
          <button className="lec-btn primary" onClick={() => navigate("/lecturer/roster")}>
            👥 Class Roster
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="lec-stats-grid">
        {[
          { label: "Total Students",      value: stats.total_students    || 0, icon: "👥", color: "#003087", bg: "#eef2fb" },
          { label: "Pending Leave",        value: stats.pending_leave     || 0, icon: "⏳", color: "#b45309", bg: "#fef3c7", urgent: true },
          { label: "Approved Absences",    value: stats.approved_absences || 0, icon: "✅", color: "#065f46", bg: "#d1fae5" },
          { label: "Sick Leave (Approved)",value: stats.sick_leave_count  || 0, icon: "🏥", color: "#dc2626", bg: "#fff5f5" },
          { label: "Non-Sick Leave",       value: stats.non_sick_count    || 0, icon: "📅", color: "#d97706", bg: "#fffbeb" },
        ].map((s) => (
          <div
            key={s.label}
            className={`lec-stat-card ${s.urgent && s.value > 0 ? "urgent" : ""}`}
            style={{ "--sc": s.color, "--sb": s.bg }}
            onClick={() => s.urgent && navigate("/lecturer/attendance?status=pending_admin")}
          >
            <div className="lsc-icon">{s.icon}</div>
            <div className="lsc-value">{s.value}</div>
            <div className="lsc-label">{s.label}</div>
            {s.urgent && s.value > 0 && <span className="lsc-urgent">New</span>}
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div className="lec-two-col">

        {/* Bar Chart — Absences by Group */}
        <div className="lec-card">
          <div className="lec-card-header">
            <h3 className="lec-card-title">📊 Approved Absences by Lecture Group</h3>
          </div>
          {data?.stats?.byGroup?.length ? (
            <>
              <div className="lec-chart-wrap">
                <canvas ref={canvasRef} width={460} height={200} className="lec-canvas" />
              </div>
              <div className="lec-legend">
                <span className="lec-legend-item"><span className="lld" style={{ background:"#dc2626" }} />Sick Leave</span>
                <span className="lec-legend-item"><span className="lld" style={{ background:"#d97706" }} />Non-Sick Leave</span>
              </div>
            </>
          ) : (
            <div className="lec-empty-chart">No approved absence data yet.</div>
          )}
        </div>

        {/* Per Group breakdown table */}
        <div className="lec-card">
          <div className="lec-card-header">
            <h3 className="lec-card-title">🏷️ Absence Count per Group</h3>
            <button className="lec-card-link" onClick={() => navigate("/lecturer/roster")}>
              View Roster →
            </button>
          </div>
          {perGroup.length === 0 ? (
            <div className="lec-empty">
              <span>🎉</span><p>No approved absences recorded yet.</p>
            </div>
          ) : (
            <table className="lec-mini-table">
              <thead>
                <tr><th>Group</th><th>Approved Absences</th><th></th></tr>
              </thead>
              <tbody>
                {perGroup.map((g) => (
                  <tr key={g.grp}
                    onClick={() => navigate(`/lecturer/attendance?lecture_group=${g.grp}`)}
                    className="lmt-row"
                  >
                    <td className="grp-cell">
                      <span className="grp-badge">{g.grp}</span>
                    </td>
                    <td>
                      <div className="grp-bar-wrap">
                        <div
                          className="grp-bar"
                          style={{ width: `${Math.min(100, (g.leave_count / (perGroup[0]?.leave_count || 1)) * 100)}%` }}
                        />
                        <span className="grp-count">{g.leave_count}</span>
                      </div>
                    </td>
                    <td className="grp-arrow">→</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Leave Applications */}
      {recentLeave.length > 0 && (
        <div className="lec-card lec-full-card">
          <div className="lec-card-header">
            <h3 className="lec-card-title">🕐 Recent Leave Applications</h3>
            <button className="lec-card-link" onClick={() => navigate("/lecturer/attendance")}>
              View All →
            </button>
          </div>
          <div className="lec-table-wrap">
            <table className="lec-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Group</th>
                  <th>Form Type</th>
                  <th>Date(s)</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLeave.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="lt-student">
                        <span className="lt-name">{r.student_name}</span>
                        <span className="lt-matric">{r.student_matric}</span>
                      </div>
                    </td>
                    <td>
                      {r.lecture_group && <span className="lec-group-badge">{r.lecture_group}</span>}
                      {r.tutorial_group && <span className="lec-group-badge tut">{r.tutorial_group}</span>}
                    </td>
                    <td className="lt-type">{FORM_LABELS[r.form_type]}</td>
                    <td className="lt-date">
                      {r.start_date ? new Date(r.start_date).toLocaleDateString("en-MY", { day:"2-digit", month:"short" }) : "—"}
                      {r.end_date && r.end_date !== r.start_date
                        ? ` – ${new Date(r.end_date).toLocaleDateString("en-MY", { day:"2-digit", month:"short" })}`
                        : ""}
                    </td>
                    <td className="lt-sub">
                      {new Date(r.submitted_at).toLocaleDateString("en-MY", { day:"2-digit", month:"short", year:"numeric" })}
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerDashboard;
