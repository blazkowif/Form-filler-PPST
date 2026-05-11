// =============================================================
// src/components/Sidebar.jsx — Role-Aware Sidebar Navigation
// =============================================================
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

// Nav items for each role
const NAV_ITEMS = {
  student: [
    { to: "/student",             label: "Dashboard",        icon: "⊞", end: true },
    { to: "/student/apply",       label: "Apply for Form",   icon: "📝" },
    { to: "/student/track",       label: "Track Applications",icon: "📊" },
  ],
  admin: [
    { to: "/admin",               label: "Dashboard",         icon: "⊞", end: true },
    { to: "/admin/applications",  label: "All Applications",  icon: "📋" },
    { to: "/admin/applications?status=pending_admin", label: "Pending Review", icon: "⏳" },
    { to: "/admin/analytics",     label: "Analytics",         icon: "📈" },
    { to: "/admin/pdf-tools",     label: "PDF Tools",         icon: "🗂️" },
  ],
  lecturer: [
    { to: "/lecturer",            label: "Dashboard",        icon: "⊞", end: true },
    { to: "/lecturer/roster",     label: "Class Roster",     icon: "👥" },
    { to: "/lecturer/attendance", label: "Attendance Records",icon: "📋" },
  ],
  pengarah: [
    { to: "/pengarah",            label: "Dashboard",         icon: "⊞", end: true },
    { to: "/pengarah/approvals",  label: "Approval Queue",    icon: "✍️" },
    { to: "/pengarah/approvals?status=fully_approved", label: "Approved", icon: "✅" },
    { to: "/pengarah/approvals?status=rejected",       label: "Rejected", icon: "❌" },
  ],
};

const ROLE_META = {
  student:  { label: "Student Portal",   color: "#003087", bg: "#eef2fb" },
  admin:    { label: "Admin Portal",     color: "#b45309", bg: "#fef3c7" },
  lecturer: { label: "Lecturer Portal",  color: "#065f46", bg: "#d1fae5" },
  pengarah: { label: "Pengarah Portal",  color: "#5b21b6", bg: "#ede9fe" },
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = NAV_ITEMS[user?.role] || [];
  const meta     = ROLE_META[user?.role]  || ROLE_META.student;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      {/* ---- Brand Header ---- */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <span className="sidebar-logo-text">UMS</span>
        </div>
        <div>
          <div className="sidebar-title">PPST E-Portal</div>
          <div
            className="sidebar-role-badge"
            style={{ color: meta.color, background: meta.bg }}
          >
            {meta.label}
          </div>
        </div>
      </div>

      {/* ---- User Info ---- */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{user?.name}</p>
          <p className="sidebar-user-id">{user?.matric_staff_id}</p>
        </div>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="sidebar-nav">
        <p className="sidebar-nav-label">Navigation</p>
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ---- Footer ---- */}
      <div className="sidebar-footer">
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <span>⎋</span>
          <span>Sign Out</span>
        </button>
        <p className="sidebar-copyright">
          © 2025 PPST, UMS
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
