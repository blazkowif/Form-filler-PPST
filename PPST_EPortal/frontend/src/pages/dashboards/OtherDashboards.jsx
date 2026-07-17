// =============================================================
// src/pages/dashboards/AdminDashboard.jsx — Placeholder
// =============================================================
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="dashboard-placeholder admin">
      <div className="dash-header">
        <div className="dash-role-badge">⚙️ Admin Portal</div>
        <button onClick={() => { logout(); navigate("/login", { replace: true }); }} className="logout-btn">Sign Out</button>
      </div>
      <div className="dash-content">
        <h1>Welcome, {user?.name}!</h1>
        <p>Staff ID: <strong>{user?.matric_staff_id}</strong></p>
        <p>Role: <strong>Administrator (Tier 1 Approver)</strong></p>
        <div className="dash-coming-soon">
          <span>📊</span>
          <p>Admin Module (Application Review & Analytics) coming in Step 3</p>
        </div>
      </div>
    </div>
  );
};

// =============================================================
// src/pages/dashboards/LecturerDashboard.jsx — Placeholder
// =============================================================
export const LecturerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="dashboard-placeholder lecturer">
      <div className="dash-header">
        <div className="dash-role-badge">📚 Lecturer Portal</div>
        <button onClick={() => { logout(); navigate("/login", { replace: true }); }} className="logout-btn">Sign Out</button>
      </div>
      <div className="dash-content">
        <h1>Welcome, {user?.name}!</h1>
        <p>Staff ID: <strong>{user?.matric_staff_id}</strong></p>
        <p>Role: <strong>Lecturer</strong></p>
        <div className="dash-coming-soon">
          <span>📋</span>
          <p>Lecturer Module (Attendance & Class Roster) coming in Step 4</p>
        </div>
      </div>
    </div>
  );
};

// =============================================================
// src/pages/dashboards/PengarahDashboard.jsx — Placeholder
// =============================================================
export const PengarahDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="dashboard-placeholder pengarah">
      <div className="dash-header">
        <div className="dash-role-badge">🏛️ Pengarah Portal</div>
        <button onClick={() => { logout(); navigate("/login", { replace: true }); }} className="logout-btn">Sign Out</button>
      </div>
      <div className="dash-content">
        <h1>Welcome, {user?.name}!</h1>
        <p>Staff ID: <strong>{user?.matric_staff_id}</strong></p>
        <p>Role: <strong>Director (Tier 2 Approver)</strong></p>
        <div className="dash-coming-soon">
          <span>✍️</span>
          <p>Pengarah Module (Digital Signature Approval) coming in Step 5</p>
        </div>
      </div>
    </div>
  );
};
