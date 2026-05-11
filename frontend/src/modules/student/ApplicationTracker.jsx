// =============================================================
// src/modules/student/ApplicationTracker.jsx
// Lists all submitted applications + detail view
// =============================================================
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import StatusBadge, { FORM_LABELS } from "../../components/StatusBadge";
import "./ApplicationTracker.css";

// ======================== List View ========================
export const ApplicationList = () => {
  const navigate = useNavigate();
  const [apps, setApps]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState({ form_type: "", status: "" });

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.form_type) params.form_type = filter.form_type;
      if (filter.status)    params.status    = filter.status;
      const res = await api.get("/student/applications", { params });
      setApps(res.data.data.applications);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, [filter]);

  return (
    <div className="tracker-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Track Applications</h1>
          <p className="page-subtitle">View the status of all your submitted forms</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/student/apply")}>
          + New Application
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select
          className="filter-select"
          value={filter.form_type}
          onChange={(e) => setFilter((f) => ({ ...f, form_type: e.target.value }))}
        >
          <option value="">All Form Types</option>
          {Object.entries(FORM_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filter.status}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="pending_admin">Pending Admin</option>
          <option value="pending_pengarah">Pending Pengarah</option>
          <option value="fully_approved">Fully Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="tracker-loading">Loading applications…</div>
      ) : error ? (
        <div className="tracker-error">{error}</div>
      ) : apps.length === 0 ? (
        <div className="tracker-empty">
          <span>📭</span>
          <p>No applications found. Start by submitting a form!</p>
          <button className="btn btn-primary" onClick={() => navigate("/student")}>
            Apply Now
          </button>
        </div>
      ) : (
        <div className="apps-table-wrap">
          <table className="apps-table">
            <thead>
              <tr>
                <th>App. ID</th>
                <th>Form Type</th>
                <th>Details</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.id}>
                  <td className="app-id-cell">#{app.id}</td>
                  <td>
                    <div className="form-type-cell">
                      <span className="ft-label">{FORM_LABELS[app.form_type]}</span>
                    </div>
                  </td>
                  <td className="reason-cell">
                    {app.reason?.substring(0, 70)}{app.reason?.length > 70 ? "…" : ""}
                  </td>
                  <td className="date-cell">
                    {new Date(app.submitted_at || app.createdAt).toLocaleDateString("en-MY", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </td>
                  <td><StatusBadge status={app.status} /></td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => navigate(`/student/track/${app.id || app._id}`)}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ======================== Detail View ========================
export const ApplicationDetail = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [app, setApp]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/student/applications/${id}`);
        setApp(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Application not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="tracker-loading">Loading…</div>;
  if (error)   return <div className="tracker-error">{error}</div>;
  if (!app)    return null;

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={() => navigate("/student/track")}>← Back</button>

      <div className="detail-header">
        <div>
          <span className="detail-id">Application #{app.id}</span>
          <h1 className="detail-title">{FORM_LABELS[app.form_type]}</h1>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {/* Approval Timeline */}
      <div className="timeline-card">
        <h3 className="timeline-title">Approval Timeline</h3>
        <div className="timeline">
          {[
            { label: "Submitted", done: true, date: app.submitted_at || app.createdAt, by: "You" },
            { label: "Admin Review", done: ["pending_pengarah","fully_approved","rejected"].includes(app.status),
              date: app.admin_approved_at, by: app.admin_name, comment: app.admin_comment,
              rejected: app.status === "rejected" && !app.pengarah_approved_at },
            { label: "Pengarah Approval", done: app.status === "fully_approved",
              date: app.pengarah_approved_at, by: app.pengarah_name, comment: app.pengarah_comment },
          ].map((step, idx) => (
            <div key={idx} className={`timeline-step ${step.done ? "done" : ""} ${step.rejected ? "rejected" : ""}`}>
              <div className="timeline-dot" />
              <div className="timeline-content">
                <span className="tl-label">{step.label}</span>
                {step.date && <span className="tl-date">{new Date(step.date).toLocaleDateString("en-MY")}</span>}
                {step.by && <span className="tl-by">By: {step.by}</span>}
                {step.comment && <span className="tl-comment">"{step.comment}"</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Data */}
      <div className="detail-card">
        <h3 className="detail-card-title">Application Details</h3>
        <div className="detail-grid">
          <DetailRow label="Form Type"   value={FORM_LABELS[app.form_type]} />
          <DetailRow label="Submitted"   value={new Date(app.submitted_at || app.createdAt).toLocaleString("en-MY")} />
          {app.start_date && <DetailRow label="Date (From)" value={new Date(app.start_date).toLocaleDateString("en-MY")} />}
          {app.end_date   && <DetailRow label="Date (To)"   value={new Date(app.end_date).toLocaleDateString("en-MY")} />}
          <DetailRow label="Reason"      value={app.reason} fullWidth />
          {/* Sick Leave extras */}
          {app.hospital_name && <DetailRow label="Hospital / Clinic" value={`${app.hospital_name} (${app.hospital_type})`} />}
          {/* Appeal Review extras */}
          {app.course_code && <DetailRow label="Course Code"    value={app.course_code} />}
          {app.course_name && <DetailRow label="Course Name"    value={app.course_name} />}
          {app.grade       && <DetailRow label="Grade"          value={app.grade} />}
          {app.receipt_no  && <DetailRow label="Receipt No."    value={app.receipt_no} />}
          {app.amount_paid && <DetailRow label="Amount Paid"    value={`RM ${Number(app.amount_paid).toFixed(2)}`} />}
        </div>

        {/* File attachment link */}
        {(app.file_path || app.mc_file_path) && (
          <div className="attachment-section">
            <a
              href={`http://localhost:5000${app.file_path || app.mc_file_path}`}
              target="_blank"
              rel="noreferrer"
              className="attachment-link"
            >
              📎 View Uploaded Document
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, fullWidth }) => (
  <div className={`detail-row ${fullWidth ? "full-width" : ""}`}>
    <span className="dr-label">{label}</span>
    <span className="dr-value">{value || "—"}</span>
  </div>
);

export default ApplicationList;
