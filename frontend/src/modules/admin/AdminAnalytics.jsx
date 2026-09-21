import { useEffect, useState } from "react";
import api from "../../services/api";
import "./AdminAnalytics.css";

const FORM_NAMES = {
  withdrawal: "Withdrawal", exam_replacement: "Exam replacement", appeal_review: "Appeal review",
  non_sick_leave: "Absence", room_booking: "Room booking", sick_leave: "Sick leave",
};

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/analytics")
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load analytics."));
  }, []);

  if (error) return <div className="analytics-state error">{error}</div>;
  if (!data) return <div className="analytics-state">Loading analytics...</div>;

  const total = data.studentCount || 0;
  return <div className="analytics-page">
    <header className="analytics-header"><div><p className="analytics-kicker">Student data intelligence</p><h1>Analytics</h1><p>Application activity, student population, and room demand in one view.</p></div></header>
    <section className="analytics-summary">
      {[['Students', total, '#0f766e'], ['Applications', data.applicationCount, '#1d4ed8'], ['Room requests', data.roomBookings, '#b45309'], ['Approval rate', `${data.approvalRate}%`, '#7c3aed']].map(([label, value, color]) => <div className="analytics-stat" key={label}><span style={{ color }}>{label}</span><strong>{value}</strong></div>)}
    </section>
    <div className="analytics-grid">
      <section className="analytics-panel"><h2>Applications by type</h2>{data.byType.map((item) => <div className="metric-row" key={item.form_type}><span>{FORM_NAMES[item.form_type] || item.form_type}</span><strong>{item.count}</strong><div className="metric-bar"><i style={{ width: `${Math.max(4, (item.count / Math.max(data.applicationCount, 1)) * 100)}%` }} /></div></div>)}</section>
      <section className="analytics-panel"><h2>Students by programme</h2>{data.studentsByProgram.map((item) => <div className="metric-row" key={item.program}><span>{item.program || "Unspecified"}</span><strong>{item.count}</strong><div className="metric-bar teal"><i style={{ width: `${Math.max(4, (item.count / Math.max(total, 1)) * 100)}%` }} /></div></div>)}</section>
      <section className="analytics-panel"><h2>Application status</h2>{data.byStatus.map((item) => <div className="status-row" key={item.status}><span>{item.status.replaceAll("_", " ")}</span><strong>{item.count}</strong></div>)}</section>
      <section className="analytics-panel"><h2>Most requested rooms</h2>{data.roomDemand.map((item) => <div className="status-row" key={item.room}><span>{item.room}</span><strong>{item.count}</strong></div>)}{!data.roomDemand.length && <p className="analytics-muted">No room bookings yet.</p>}</section>
    </div>
  </div>;
};

export default AdminAnalytics;
