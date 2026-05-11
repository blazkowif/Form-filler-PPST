// =============================================================
// src/modules/student/StudentDashboard.jsx
// Home page for students — stats summary + 6 form selection cards
// =============================================================
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import StatusBadge, { FORM_LABELS } from "../../components/StatusBadge";
import "./StudentDashboard.css";

// --- The 6 form cards ---
const FORMS = [
  {
    key:         "sick_leave",
    code:        "PPST/AKD-06",
    title:       "Sick Leave",
    subtitle:    "Borang Permohonan Cuti Sakit",
    description: "Apply for sick leave with a medical certificate from a registered doctor or hospital.",
    icon:        "🏥",
    color:       "#dc2626",
    bg:          "#fff5f5",
    border:      "#fecaca",
    route:       "/student/apply/sick_leave",
  },
  {
    key:         "non_sick_leave",
    code:        "PPST/AKD-07",
    title:       "Non-Sick Leave",
    subtitle:    "Borang Tunjuk Sebab Tidak Hadir",
    description: "Justify absence from lectures, tutorials, or practicals for non-medical reasons.",
    icon:        "📅",
    color:       "#d97706",
    bg:          "#fffbeb",
    border:      "#fde68a",
    route:       "/student/apply/non_sick_leave",
  },
  {
    key:         "appeal_review",
    code:        "PPST/AKD-03",
    title:       "Appeal Exam Review",
    subtitle:    "Rayuan Semakan Semula Keputusan Peperiksaan",
    description: "Appeal to review your examination results. RM100 payment receipt required per course.",
    icon:        "📝",
    color:       "#2563eb",
    bg:          "#eff6ff",
    border:      "#bfdbfe",
    route:       "/student/apply/appeal_review",
  },
  {
    key:         "withdrawal",
    code:        "PPST/AKD-01",
    title:       "Withdrawal from Studies",
    subtitle:    "Permohonan Berhenti Pengajian",
    description: "Submit a formal application to withdraw from your study programme at UMS PPST.",
    icon:        "🎓",
    color:       "#7c3aed",
    bg:          "#f5f3ff",
    border:      "#ddd6fe",
    route:       "/student/apply/withdrawal",
  },
  {
    key:         "exam_replacement",
    code:        "PPST/AKD-02",
    title:       "Replacement / Repeat Exam",
    subtitle:    "Peperiksaan Gantian / Ulangan",
    description: "Apply to sit for a replacement or repeat examination due to illness or bereavement.",
    icon:        "✏️",
    color:       "#059669",
    bg:          "#ecfdf5",
    border:      "#a7f3d0",
    route:       "/student/apply/exam_replacement",
  },
  {
    key:         "room_booking",
    code:        "PPST/AKD-05",
    title:       "Room Booking",
    subtitle:    "Tempahan Bilik Kuliah / Tutorial",
    description: "Book lecture halls or tutorial rooms at the PPST building. Submit 7 days in advance.",
    icon:        "🏛️",
    color:       "#0891b2",
    bg:          "#ecfeff",
    border:      "#a5f3fc",
    route:       "/student/apply/room_booking",
  },
];

const StudentDashboard = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [dashData,  setDashData]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/student/dashboard");
        setDashData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const stats = dashData?.stats || {};
  const recent = dashData?.recent || [];

  return (
    <div className="student-dashboard">
      {/* ---- Page Header ---- */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Selamat Datang,{" "}
            <span className="title-name">{user?.name?.split(" ")[0]}!</span>
          </h1>
          <p className="page-subtitle">
            {user?.profile?.program || "Asasi Sains"} ·{" "}
            {new Date().toLocaleDateString("en-MY", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
          </p>
        </div>
        <div className="header-meta">
          <span className="matric-chip">{user?.matric_staff_id}</span>
        </div>
      </div>

      {/* ---- Stats Cards ---- */}
      {!loading && (
        <div className="stats-grid">
          {[
            { label: "Total Applications", value: stats.total || 0,            color: "#003087", bg: "#eef2fb" },
            { label: "Pending Admin",       value: stats.pending_admin || 0,    color: "#b45309", bg: "#fef3c7" },
            { label: "Pending Pengarah",    value: stats.pending_pengarah || 0, color: "#1e40af", bg: "#dbeafe" },
            { label: "Fully Approved",      value: stats.fully_approved || 0,   color: "#065f46", bg: "#d1fae5" },
            { label: "Rejected",            value: stats.rejected || 0,         color: "#991b1b", bg: "#fee2e2" },
          ].map((s) => (
            <div key={s.label} className="stat-card" style={{ "--stat-color": s.color, "--stat-bg": s.bg }}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ---- Form Cards Grid ---- */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">📋 Apply for a Form</h2>
          <p className="section-subtitle">Select the form you wish to submit below</p>
        </div>

        <div className="forms-grid">
          {FORMS.map((form) => (
            <div
              key={form.key}
              className="form-card"
              style={{ "--fc": form.color, "--fb": form.bg, "--fbd": form.border }}
              onClick={() => navigate(form.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate(form.route)}
            >
              <div className="form-card-icon" style={{ background: form.bg }}>
                {form.icon}
              </div>
              <div className="form-card-body">
                <span className="form-card-code">{form.code}</span>
                <h3 className="form-card-title">{form.title}</h3>
                <p className="form-card-subtitle">{form.subtitle}</p>
                <p className="form-card-desc">{form.description}</p>
              </div>
              <div className="form-card-arrow">→</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Recent Activity ---- */}
      {recent.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">🕐 Recent Activity</h2>
            <button className="link-btn" onClick={() => navigate("/student/track")}>
              View All →
            </button>
          </div>
          <div className="recent-table-wrap">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Form Type</th>
                  <th>Reason</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/student/track/${app.id || app._id}`)}
                    className="table-row-clickable"
                  >
                    <td className="app-id">#{app.id}</td>
                    <td>{FORM_LABELS[app.form_type] || app.form_type}</td>
                    <td className="reason-cell">{app.reason?.substring(0, 60)}{app.reason?.length > 60 ? "…" : ""}</td>
                    <td>{new Date(app.submitted_at || app.createdAt).toLocaleDateString("en-MY")}</td>
                    <td><StatusBadge status={app.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {error && <div className="dash-error">{error}</div>}
    </div>
  );
};

export default StudentDashboard;
