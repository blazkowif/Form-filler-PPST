// =============================================================
// src/components/ProtectedRoute.jsx — RBAC Route Guard
// Redirects unauthenticated users to the correct login page:
//   student roles  → /login
//   staff roles    → /login/staff
// =============================================================
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STAFF_ROLES = ["admin", "lecturer", "pengarah"];

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Verifying session…</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to the right login page based on what route was attempted
    const isStaffRoute = STAFF_ROLES.some((r) =>
      location.pathname.startsWith(`/${r}`)
    );
    const loginPath = isStaffRoute ? "/login/staff" : "/login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to their own dashboard
  if (roles.length > 0 && !roles.includes(user.role)) {
    const dashboards = {
      student: "/student", admin: "/admin",
      lecturer: "/lecturer", pengarah: "/pengarah",
    };
    return <Navigate to={dashboards[user.role] || "/login"} replace />;
  }

  return children;
};

export default ProtectedRoute;
