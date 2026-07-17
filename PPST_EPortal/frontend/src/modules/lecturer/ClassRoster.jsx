// =============================================================
// src/modules/lecturer/ClassRoster.jsx
// Searchable student roster with per-student absence counts
// =============================================================
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./ClassRoster.css";

const ClassRoster = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const [filters, setFilters] = useState({
    lecture_group:   "",
    tutorial_group:  "",
    search:          "",
  });

  // Fetch distinct groups for filter dropdowns
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get("/lecturer/dashboard");
        setGroups(res.data.data.groups || []);
      } catch (err) { /* non-fatal */ }
    };
    fetchGroups();
  }, []);

  const fetchRoster = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.lecture_group)  params.lecture_group  = filters.lecture_group;
      if (filters.tutorial_group) params.tutorial_group = filters.tutorial_group;
      if (filters.search)         params.search         = filters.search;

      const res = await api.get("/lecturer/roster", { params });
      setStudents(res.data.data.students);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load roster.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

  // Unique group values for dropdowns
  const lectureGroups  = [...new Set(groups.map((g) => g.lecture_group).filter(Boolean))].sort();
  const tutorialGroups = [...new Set(groups.map((g) => g.tutorial_group).filter(Boolean))].sort();

  const handleFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  // Absence risk colour
  const riskColor = (count) => {
    if (count >= 5) return "#dc2626";
    if (count >= 3) return "#d97706";
    return "#065f46";
  };
  const riskBg = (count) => {
    if (count >= 5) return "#fff5f5";
    if (count >= 3) return "#fffbeb";
    return "#ecfdf5";
  };

  return (
    <div className="roster-page">
      {/* Header */}
      <div className="roster-header">
        <div>
          <h1 className="roster-title">👥 Class Roster</h1>
          <p className="roster-subtitle">
            {loading ? "Loading…" : `${students.length} student${students.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <button className="roster-back-btn" onClick={() => navigate("/lecturer")}>
          ← Dashboard
        </button>
      </div>

      {/* Filters */}
      <div className="roster-filters">
        <input
          type="text"
          className="roster-search"
          placeholder="🔍 Search by name or matric ID…"
          value={filters.search}
          onChange={(e) => handleFilter("search", e.target.value)}
        />
        <select
          className="roster-select"
          value={filters.lecture_group}
          onChange={(e) => handleFilter("lecture_group", e.target.value)}
        >
          <option value="">All Lecture Groups</option>
          {lectureGroups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select
          className="roster-select"
          value={filters.tutorial_group}
          onChange={(e) => handleFilter("tutorial_group", e.target.value)}
        >
          <option value="">All Tutorial Groups</option>
          {tutorialGroups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        {(filters.lecture_group || filters.tutorial_group || filters.search) && (
          <button
            className="roster-clear"
            onClick={() => setFilters({ lecture_group:"", tutorial_group:"", search:"" })}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="roster-state"><div className="loading-spinner" /> Loading…</div>
      ) : error ? (
        <div className="roster-state error">{error}</div>
      ) : students.length === 0 ? (
        <div className="roster-state empty">
          <span>📭</span>
          <p>No students match the current filters.</p>
        </div>
      ) : (
        <div className="roster-table-wrap">
          <table className="roster-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Programme</th>
                <th>Lec. Group</th>
                <th>Tut. Group</th>
                <th>Prac. Group</th>
                <th>Sick Leave</th>
                <th>Non-Sick</th>
                <th>Total Absences</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.id}>
                  <td className="td-num">{idx + 1}</td>
                  <td>
                    <div className="td-student">
                      <div className="td-avatar">{s.name?.charAt(0)}</div>
                      <div className="td-info">
                        <span className="td-name">{s.name}</span>
                        <span className="td-matric">{s.matric_staff_id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="td-program">{s.program || "—"}</td>
                  <td>
                    {s.lecture_group
                      ? <span className="group-tag lec">{s.lecture_group}</span>
                      : <span className="td-nil">—</span>}
                  </td>
                  <td>
                    {s.tutorial_group
                      ? <span className="group-tag tut">{s.tutorial_group}</span>
                      : <span className="td-nil">—</span>}
                  </td>
                  <td>
                    {s.practical_group
                      ? <span className="group-tag prac">{s.practical_group}</span>
                      : <span className="td-nil">—</span>}
                  </td>
                  <td className="td-count">
                    <span className="count-chip" style={{ color: riskColor(s.sick_leave_count), background: riskBg(s.sick_leave_count) }}>
                      {s.sick_leave_count}
                    </span>
                  </td>
                  <td className="td-count">
                    <span className="count-chip" style={{ color: riskColor(s.non_sick_count), background: riskBg(s.non_sick_count) }}>
                      {s.non_sick_count}
                    </span>
                  </td>
                  <td className="td-count">
                    <span
                      className="count-chip total"
                      style={{ color: riskColor(s.total_absences), background: riskBg(s.total_absences) }}
                    >
                      {s.total_absences}
                    </span>
                  </td>
                  <td>
                    <button
                      className="view-history-btn"
                      onClick={() => navigate(`/lecturer/attendance?student_id=${s._id?.toString() || s.id}`)}
                    >
                      History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="roster-legend">
        <span className="rl-item"><span className="rl-dot" style={{ background:"#065f46" }} />0–2 absences (Normal)</span>
        <span className="rl-item"><span className="rl-dot" style={{ background:"#d97706" }} />3–4 absences (Monitor)</span>
        <span className="rl-item"><span className="rl-dot" style={{ background:"#dc2626" }} />5+ absences (At Risk)</span>
      </div>
    </div>
  );
};

export default ClassRoster;
