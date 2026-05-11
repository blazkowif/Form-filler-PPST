// =============================================================
// src/pages/Login.jsx — PPST E-Portal Login Screen
// =============================================================
// Handles user login with:
//   - Form validation
//   - Loading states
//   - Error display
//   - Role-based redirect after login
// =============================================================

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

/**
 * Map each role to its dashboard route.
 */
const ROLE_REDIRECT = {
  student: "/student",
  admin: "/admin",
  lecturer: "/lecturer",
  pengarah: "/pengarah",
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    matric_staff_id: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // If the user is already logged in, redirect immediately
  useEffect(() => {
    if (user) {
      navigate(ROLE_REDIRECT[user.role] || "/", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error message when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client-side validation
    if (!formData.matric_staff_id.trim()) {
      setError("Please enter your Matric / Staff ID.");
      return;
    }
    if (!formData.password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await login(
      formData.matric_staff_id.trim(),
      formData.password
    );

    setIsLoading(false);

    if (result.success) {
      // If the user tried to visit a protected route before logging in,
      // redirect them there. Otherwise, go to their role's dashboard.
      const intendedRoute = location.state?.from?.pathname;
      const destination =
        intendedRoute || ROLE_REDIRECT[result.user.role] || "/";
      navigate(destination, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-page">
      {/* ---- Left Panel: Branding ---- */}
      <div className="login-branding">
        <div className="branding-content">
          <div className="ums-logo-area">
            <div className="ums-crest">
              <span>UMS</span>
            </div>
          </div>
          <h1 className="university-name">Universiti Malaysia Sabah</h1>
          <div className="divider-line" />
          <h2 className="centre-name">Pusat Persediaan Sains dan Teknologi</h2>
          <p className="centre-subtitle">Preparatory Centre for Science & Technology</p>
          <div className="portal-badge">
            <span className="badge-icon">◈</span>
            <span>PPST E-Portal 2025</span>
          </div>
          <ul className="feature-list">
            <li>
              <span className="feature-dot" />
              Digital Form Submission
            </li>
            <li>
              <span className="feature-dot" />
              Real-Time Application Tracking
            </li>
            <li>
              <span className="feature-dot" />
              Paperless Approval Workflow
            </li>
            <li>
              <span className="feature-dot" />
              Digital Signature Integration
            </li>
          </ul>
        </div>
        <div className="branding-footer">
          <p>Jalan UMS, 88400 Kota Kinabalu, Sabah</p>
          <p>Tel: (+6088) 320000 · pejppst@ums.edu.my</p>
        </div>
      </div>

      {/* ---- Right Panel: Login Form ---- */}
      <div className="login-form-panel">
        <div className="login-card">
          {/* Header */}
          <div className="login-card-header">
            <div className="lock-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="login-card-title">Staff & Student Login</h3>
            <p className="login-card-subtitle">
              Sign in with your UMS Matric or Staff ID
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="error-alert" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="login-form">
            {/* Matric / Staff ID */}
            <div className="form-group">
              <label htmlFor="matric_staff_id" className="form-label">
                Matric / Staff ID
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="matric_staff_id"
                  name="matric_staff_id"
                  type="text"
                  value={formData.matric_staff_id}
                  onChange={handleChange}
                  placeholder="e.g. BS2024001 or ADMIN001"
                  className="form-input"
                  autoComplete="username"
                  autoFocus
                  disabled={isLoading}
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="form-input"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`login-btn ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner" />
                  Authenticating...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Sign In to Portal
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <p className="login-help">
            Having trouble? Contact the PPST Academic Office at{" "}
            <a href="mailto:pejppst@ums.edu.my">pejppst@ums.edu.my</a>
          </p>
        </div>

        {/* Role Guide Cards */}
        <div className="role-guide">
          <p className="role-guide-title">Login with your role:</p>
          <div className="role-cards">
            {[
              { role: "Student", icon: "🎓", id: "Matric No." },
              { role: "Lecturer", icon: "📚", id: "Staff ID" },
              { role: "Admin", icon: "⚙️", id: "Staff ID" },
              { role: "Pengarah", icon: "🏛️", id: "Staff ID" },
            ].map(({ role, icon, id }) => (
              <div key={role} className="role-card">
                <span className="role-card-icon">{icon}</span>
                <span className="role-card-name">{role}</span>
                <span className="role-card-id">{id}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="copyright">
          © 2025 Pusat Persediaan Sains dan Teknologi, UMS. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
