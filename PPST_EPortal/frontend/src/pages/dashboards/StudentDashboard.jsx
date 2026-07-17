// =============================================================
// src/pages/dashboards/StudentDashboard.jsx
// Placeholder — will be fully built in Step 2 (Student Module)
// =============================================================
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-placeholder student">
      <div className="dash-header">
        <div className="dash-role-badge">🎓 Student Portal</div>
        <button onClick={handleLogout} className="logout-btn">Sign Out</button>
      </div>
      <div className="dash-content">
        <h1>Welcome, {user?.name}!</h1>
        <p>Matric No: <strong>{user?.matric_staff_id}</strong></p>
        <p>Programme: <strong>{user?.profile?.program || "—"}</strong></p>
        <div className="dash-coming-soon">
          <span>📋</span>
          <p>Student Module (Form Submission & Tracking) coming in Step 2</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
