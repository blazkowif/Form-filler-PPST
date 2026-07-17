// =============================================================
// src/modules/lecturer/AttendanceRecords.jsx
// Paginated, filterable view of all leave/absence applications
// =============================================================
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import StatusBadge, { FORM_LABELS } from "../../components/StatusBadge";
import "./AttendanceRecords.css";

const AttendanceRecords = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    form_type:     searchParams.get("form_type")     || "",
    status:        searchParams.get("status")        || "",
    lecture_group: searchParams.get("lecture_group") || "",
    student_id:    searchParams.get("student_id")    || "",
  });
  const [page,       setPage]       = useState(1);
  const [records,    setRecords]    = useState([]);
  const [pagination, setPagination] = useState(null);
  const [groups,     setGroups]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  // Fetch group list for filter dropdown
  useEffect(() => {
    api.get("/lecturer/dashboard")
      .then((res) => setGroups(res.data.data.groups || []))
      .catch(() => {});
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 20 };
      if (filters.form_type)     params.form_type     = filters.form_type;
      if (filters.status)        params.status        = filters.status;
      if (filters.lecture_group) params.lecture_group = filters.lecture_group;
      if (filters.student_id)    params.student_id    = filters.student_id;

      const res = await api.get("/lecturer/attendance", { params });
      setRecords(res.data.data.records);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load records.");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    const p = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; });
    setSearchParams(p, { replace: true });
  }, [filters, setSearchParams]);

  const handleFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const lectureGroups = [...new Set(groups.map((g) => g.lecture_group).filter(Boolean))].sort();

  const dateRange = (start, end) => {
    if (!start) return "—";
    const s = new Date(start).toLocaleDateString("en-MY", { day:"2-digit", month:"short", year:"numeric" });
    if (!end || end === start) return s;
    const e = new Date(end).toLocaleDateString("en-MY", { day:"2-digit", month:"short", year:"numeric" });
    return `${s} → ${e}`;
  };

  // If filtered to a specific student, show their name in the header
  const hasStudentFilter = !!filters.student_id;

  return (
    <div className="att-page">
      {/* Header */}
      <div className="att-header">
        <div>
          <h1 className="att-title">📋 Attendance / Absence Records</h1>
          <p className="att-subtitle">
            {hasStudentFilter
              ? "Showing records for a specific student"
              : pagination
                ? `${pagination.total} total leave record${pagination.total !== 1 ? "s" : ""}`
                : "Loading…"}
          </p>
        </div>
        <div className="att-header-btns">
          {hasStudentFilter && (
            <button
              className="att-clear-student"
              onClick={() => handleFilter("student_id", "")}
            >
              ✕ Remove student filter
            </button>
          )}
          <button className="att-back-btn" onClick={() => navigate("/lecturer")}>
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="att-filters">
        <select
          className="att-select"
          value={filters.form_type}
          onChange={(e) => handleFilter("form_type", e.target.value)}
        >
          <option value="">Sick + Non-Sick Leave</option>
          <option value="sick_leave">🏥 Sick Leave Only</option>
          <option value="non_sick_leave">📅 Non-Sick Leave Only</option>
        </select>
        <select
          className="att-select"
          value={filters.status}
          onChange={(e) => handleFilter("status", e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending_admin">⏳ Pending Admin</option>
          <option value="pending_pengarah">📤 Pending Pengarah</option>
          <option value="fully_approved">✅ Fully Approved</option>
          <option value="rejected">❌ Rejected</option>
        </select>
        <select
          className="att-select"
          value={filters.lecture_group}
          onChange={(e) => handleFilter("lecture_group", e.target.value)}
        >
          <option value="">All Groups</option>
          {lectureGroups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        {(filters.form_type || filters.status || filters.lecture_group) && (
          <button
            className="att-clear"
            onClick={() => setFilters((f) => ({ ...f, form_type:"", status:"", lecture_group:"" }))}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="att-state"><div className="loading-spinner" /> Loading…</div>
      ) : error ? (
        <div className="att-state error">{error}</div>
      ) : records.length === 0 ? (
        <div className="att-state empty">
          <span>📭</span>
          <p>No leave records match the current filters.</p>
        </div>
      ) : (
        <>
          <div className="att-table-wrap">
            <table className="att-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student</th>
                  <th>Group</th>
                  <th>Leave Type</th>
                  <th>Date(s) of Absence</th>
                  <th>Reason</th>
                  <th>Hospital / Details</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className={r.status === "pending_admin" ? "att-row-pending" : ""}>
                    <td className="att-id">#{r.id}</td>
                    <td>
                      <div className="att-student">
                        <span className="att-sname">{r.student_name}</span>
                        <span className="att-smatric">{r.student_matric}</span>
                      </div>
                    </td>
                    <td>
                      {r.lecture_group && (
                        <span className="att-group lec">{r.lecture_group}</span>
                      )}
                      {r.tutorial_group && (
                        <span className="att-group tut">{r.tutorial_group}</span>
                      )}
                    </td>
                    <td>
                      <span className={`att-type ${r.form_type === "sick_leave" ? "sick" : "nonsick"}`}>
                        {r.form_type === "sick_leave" ? "🏥 Sick" : "📅 Non-Sick"}
                      </span>
                    </td>
                    <td className="att-dates">{dateRange(r.start_date, r.end_date)}</td>
                    <td className="att-reason">
                      {r.reason?.substring(0, 60)}{r.reason?.length > 60 ? "…" : ""}
                    </td>
                    <td className="att-hospital">
                      {r.hospital_name
                        ? <span>{r.hospital_name}<br /><small className="att-htype">{r.hospital_type}</small></span>
                        : <span className="att-nil">—</span>}
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="att-pagination">
              <button className="pag-btn" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>← Prev</button>
              <span className="pag-info">Page {pagination.page} of {pagination.pages}</span>
              <button className="pag-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.pages}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceRecords;
