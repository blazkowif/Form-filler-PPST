// =============================================================
// src/modules/admin/AdminApplicationList.jsx
// Full paginated table of all student applications
// with search, filter by form_type/status, and click-to-review
// =============================================================
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import StatusBadge, { FORM_LABELS } from "../../components/StatusBadge";
import "./AdminApplicationList.css";

const FORM_COLORS = {
  sick_leave: "#dc2626", non_sick_leave: "#d97706", appeal_review: "#2563eb",
  withdrawal: "#7c3aed", exam_replacement: "#059669", room_booking: "#0891b2",
};

const AdminApplicationList = () => {
  const navigate       = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters — initialise from URL query params so links work
  const [filters, setFilters] = useState({
    form_type: searchParams.get("form_type") || "",
    status:    searchParams.get("status")    || "",
    search:    searchParams.get("search")    || "",
  });
  const [page,    setPage]    = useState(1);
  const [apps,    setApps]    = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 15 };
      if (filters.form_type) params.form_type = filters.form_type;
      if (filters.status)    params.status    = filters.status;
      if (filters.search)    params.search    = filters.search;

      const res = await api.get("/admin/applications", { params });
      setApps(res.data.data.applications);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  // Sync filters to URL
  useEffect(() => {
    const p = {};
    if (filters.form_type) p.form_type = filters.form_type;
    if (filters.status)    p.status    = filters.status;
    if (filters.search)    p.search    = filters.search;
    setSearchParams(p, { replace: true });
  }, [filters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  return (
    <div className="admin-list-page">
      {/* Header */}
      <div className="alp-header">
        <div>
          <h1 className="alp-title">All Applications</h1>
          <p className="alp-subtitle">
            {pagination ? `${pagination.total} total applications` : "Loading…"}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="alp-filters">
        <input
          type="text"
          className="alp-search"
          placeholder="🔍 Search by name or matric ID…"
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />
        <select
          className="alp-select"
          value={filters.form_type}
          onChange={(e) => handleFilterChange("form_type", e.target.value)}
        >
          <option value="">All Form Types</option>
          {Object.entries(FORM_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="alp-select"
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending_admin">⏳ Pending My Review</option>
          <option value="pending_pengarah">📤 With Pengarah</option>
          <option value="fully_approved">✅ Fully Approved</option>
          <option value="rejected">❌ Rejected</option>
        </select>
        {(filters.form_type || filters.status || filters.search) && (
          <button
            className="alp-clear-btn"
            onClick={() => { setFilters({ form_type:"", status:"", search:"" }); setPage(1); }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="alp-state"><div className="loading-spinner" /> Loading…</div>
      ) : error ? (
        <div className="alp-state error">{error}</div>
      ) : apps.length === 0 ? (
        <div className="alp-state empty">
          <span>📭</span><p>No applications match the current filters.</p>
        </div>
      ) : (
        <>
          <div className="alp-table-wrap">
            <table className="alp-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student</th>
                  <th>Programme</th>
                  <th>Form Type</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id} className={app.status === "pending_admin" ? "row-urgent" : ""}>
                    <td className="td-id">#{app.id}</td>
                    <td>
                      <div className="td-student">
                        <span className="td-name">{app.student_name}</span>
                        <span className="td-matric">{app.student_matric}</span>
                      </div>
                    </td>
                    <td className="td-program">{app.program || "—"}</td>
                    <td>
                      <span
                        className="td-formtype"
                        style={{ color: FORM_COLORS[app.form_type] || "#003087" }}
                      >
                        {FORM_LABELS[app.form_type]}
                      </span>
                    </td>
                    <td className="td-date">
                      {new Date(app.submitted_at).toLocaleDateString("en-MY", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                    <td><StatusBadge status={app.status} /></td>
                    <td>
                      <button
                        className={`alp-review-btn ${app.status === "pending_admin" ? "primary" : "secondary"}`}
                        onClick={() => navigate(`/admin/applications/${app.id}`)}
                      >
                        {app.status === "pending_admin" ? "Review" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="alp-pagination">
              <button
                className="pag-btn"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                ← Prev
              </button>
              <span className="pag-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="pag-btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.pages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminApplicationList;
