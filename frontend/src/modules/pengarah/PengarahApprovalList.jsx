// =============================================================
// src/modules/pengarah/PengarahApprovalList.jsx
// Filterable list of all admin-approved applications
// =============================================================
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import StatusBadge, { FORM_LABELS } from "../../components/StatusBadge";
import "./PengarahApprovalList.css";

const FORM_COLORS = {
  sick_leave:"#dc2626", non_sick_leave:"#d97706", appeal_review:"#2563eb",
  withdrawal:"#7c3aed", exam_replacement:"#059669", room_booking:"#0891b2",
};

const PengarahApprovalList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    status:    searchParams.get("status")    || "pending_pengarah",
    form_type: searchParams.get("form_type") || "",
    search:    searchParams.get("search")    || "",
  });
  const [page,       setPage]       = useState(1);
  const [apps,       setApps]       = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 15 };
      if (filters.status)    params.status    = filters.status;
      if (filters.form_type) params.form_type = filters.form_type;
      if (filters.search)    params.search    = filters.search;
      const res = await api.get("/pengarah/applications", { params });
      setApps(res.data.data.applications);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchApps(); }, [fetchApps]);
  useEffect(() => {
    const p = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; });
    setSearchParams(p, { replace: true });
  }, [filters, setSearchParams]);

  const handleFilter = (key, val) => { setFilters((f) => ({ ...f, [key]: val })); setPage(1); };

  return (
    <div className="pal-page">
      <div className="pal-header">
        <div>
          <h1 className="pal-title">✍️ Approval Queue</h1>
          <p className="pal-subtitle">
            {pagination
              ? `${pagination.total} application${pagination.total !== 1 ? "s" : ""} found`
              : "Loading…"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="pal-filters">
        <select className="pal-select" value={filters.status}
          onChange={(e) => handleFilter("status", e.target.value)}>
          <option value="pending_pengarah">⏳ Awaiting My Approval</option>
          <option value="fully_approved">✅ Fully Approved</option>
          <option value="rejected">❌ Rejected</option>
          <option value="">All Statuses</option>
        </select>
        <select className="pal-select" value={filters.form_type}
          onChange={(e) => handleFilter("form_type", e.target.value)}>
          <option value="">All Form Types</option>
          {Object.entries(FORM_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input type="text" className="pal-search"
          placeholder="🔍 Search student name or matric…"
          value={filters.search}
          onChange={(e) => handleFilter("search", e.target.value)}
        />
        {(filters.form_type || filters.search) && (
          <button className="pal-clear"
            onClick={() => setFilters((f) => ({ ...f, form_type:"", search:"" }))}>
            ✕ Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="pal-state"><div className="loading-spinner" />Loading…</div>
      ) : error ? (
        <div className="pal-state error">{error}</div>
      ) : apps.length === 0 ? (
        <div className="pal-state empty">
          <span>{filters.status === "pending_pengarah" ? "🎉" : "📭"}</span>
          <p>{filters.status === "pending_pengarah"
            ? "No pending applications — you're all caught up!"
            : "No applications match the current filters."}</p>
        </div>
      ) : (
        <>
          <div className="pal-table-wrap">
            <table className="pal-table">
              <thead>
                <tr>
                  <th>ID</th><th>Student</th><th>Programme</th>
                  <th>Form Type</th><th>Admin Approved</th>
                  <th>Admin Note</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id} className={app.status === "pending_pengarah" ? "pal-row-urgent" : ""}>
                    <td className="pal-id">#{app.id}</td>
                    <td>
                      <div className="pal-student">
                        <span className="pal-sname">{app.student_name}</span>
                        <span className="pal-smatric">{app.student_matric}</span>
                      </div>
                    </td>
                    <td className="pal-prog">{app.program || "—"}</td>
                    <td>
                      <span className="pal-ftype" style={{ color: FORM_COLORS[app.form_type] }}>
                        {FORM_LABELS[app.form_type]}
                      </span>
                    </td>
                    <td className="pal-date">
                      {app.admin_approved_at
                        ? new Date(app.admin_approved_at).toLocaleDateString("en-MY",
                            { day:"2-digit", month:"short", year:"numeric" })
                        : "—"}
                      <br />
                      <small className="pal-admin-by">by {app.admin_name || "—"}</small>
                    </td>
                    <td className="pal-comment">
                      {app.admin_comment
                        ? app.admin_comment.substring(0,50) + (app.admin_comment.length > 50 ? "…" : "")
                        : <span className="pal-nil">—</span>}
                    </td>
                    <td><StatusBadge status={app.status} /></td>
                    <td>
                      <button
                        className={`pal-action-btn ${app.status === "pending_pengarah" ? "primary" : "secondary"}`}
                        onClick={() => navigate(`/pengarah/approvals/${app.id}`)}
                      >
                        {app.status === "pending_pengarah" ? "Review & Sign" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="pal-pagination">
              <button className="pag-btn" onClick={() => setPage(p => p-1)} disabled={page <= 1}>← Prev</button>
              <span className="pag-info">Page {pagination.page} of {pagination.pages}</span>
              <button className="pag-btn" onClick={() => setPage(p => p+1)} disabled={page >= pagination.pages}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PengarahApprovalList;
