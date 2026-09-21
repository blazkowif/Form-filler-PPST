import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./SchedulePage.css";

const DAY_ORDER = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat"];

const SchedulePage = () => {
  const [schedule, setSchedule] = useState(null);
  const [day, setDay] = useState("Isnin");
  const [venue, setVenue] = useState("");
  const [type, setType] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/schedule")
      .then((res) => setSchedule(res.data.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load the schedule."));
  }, []);

  const venues = schedule?.venues || [];
  const sessionTypes = schedule?.sessionTypes || [];
  const entries = useMemo(() => (schedule?.schedule || [])
    .filter((item) => !day || item.day === day)
    .filter((item) => !venue || item.venueId === venue)
    .filter((item) => !type || item.type === type)
    .sort((a, b) => a.startTime.localeCompare(b.startTime)), [schedule, day, venue, type]);

  return (
    <div className="schedule-page">
      <header className="schedule-header">
        <div>
          <p className="schedule-kicker">Shared timetable</p>
          <h1>{schedule?.metadata?.title || "PPST Class Schedule"}</h1>
          <p>{schedule?.metadata?.faculty} · {schedule?.metadata?.term}</p>
        </div>
        <Link className="schedule-book-link" to="/student/apply/room_booking">Room booking</Link>
      </header>

      <div className="schedule-warning">
        <strong>Check before booking.</strong> This timetable is a reference for occupied rooms. Room booking remains available, but verify the day and time here before submitting.
      </div>

      {error && <div className="schedule-state error">{error}</div>}
      {!schedule && !error && <div className="schedule-state">Loading schedule...</div>}
      {schedule && (
        <>
          <div className="schedule-filters">
            <div className="schedule-days" role="tablist" aria-label="Schedule day">
              {DAY_ORDER.map((item) => (
                <button key={item} className={day === item ? "active" : ""} onClick={() => setDay(item)}>{item}</button>
              ))}
            </div>
            <select value={venue} onChange={(e) => setVenue(e.target.value)} aria-label="Filter by venue">
              <option value="">All venues</option>
              {venues.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by session type">
              <option value="">All session types</option>
              {sessionTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>

          <div className="schedule-table-wrap">
            <table className="schedule-table">
              <thead><tr><th>Time</th><th>Room</th><th>Subject</th><th>Group</th><th>Type</th></tr></thead>
              <tbody>
                {entries.map((item) => {
                  const room = venues.find((candidate) => candidate.id === item.venueId);
                  const session = sessionTypes.find((candidate) => candidate.id === item.type);
                  return <tr key={item.id}>
                    <td>{item.startTime} - {item.endTime}</td>
                    <td><strong>{item.venueId}</strong><small>{room?.name}</small></td>
                    <td>{item.subject}</td><td>{item.group}</td>
                    <td><span className="schedule-type" style={{ borderColor: session?.color }}>{session?.label || item.type}</span></td>
                  </tr>;
                })}
                {!entries.length && <tr><td colSpan="5" className="schedule-empty">No sessions match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default SchedulePage;
