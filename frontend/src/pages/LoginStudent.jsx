// =============================================================
// src/pages/LoginStudent.jsx
// Route: /login  →  Students only
// Rejects with a clear message if a staff ID is entered
// =============================================================
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginStudent.css";

const LoginStudent = () => {
  const navigate        = useNavigate();
  const { login, user } = useAuth();

  const [formData, setFormData]   = useState({ matric_staff_id: "", password: "" });
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");

  // Already logged in as student → go to dashboard
  useEffect(() => {
    if (user?.role === "student") navigate("/student", { replace: true });
    // If somehow a staff member lands here, don't redirect — let them see the error
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.matric_staff_id.trim()) { setError("Please enter your Matric Number."); return; }
    if (!formData.password)               { setError("Please enter your password."); return; }

    setIsLoading(true);
    const result = await login(formData.matric_staff_id.trim(), formData.password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    // Role guard — reject non-students
    if (result.user.role !== "student") {
      setError(
        "This portal is for students only. Staff members please use the " +
        "Staff Login page."
      );
      // Log them back out immediately
      sessionStorage.removeItem("ppst_token");
      sessionStorage.removeItem("ppst_user");
      return;
    }

    navigate("/student", { replace: true });
  };

  return (
    <div className="ls-page">
      {/* ── Left Branding Panel ── */}
      <div className="ls-brand">
        <div className="ls-brand-content">
          <div className="ls-crest">UMS</div>
          <h1 className="ls-uni-name">Universiti Malaysia Sabah</h1>
          <div className="ls-divider" />
          <h2 className="ls-centre-name">Pusat Persediaan Sains dan Teknologi</h2>
          <p className="ls-centre-sub">Preparatory Centre for Science &amp; Technology</p>

          <div className="ls-portal-tag">
            <span className="ls-portal-dot" />
            PPST E-Portal 2025 — Student Access
          </div>

          <ul className="ls-features">
            {[
              "Submit digital forms online",
              "Track application status in real-time",
              "Paperless approval workflow",
              "Receive instant notifications",
            ].map((f) => (
              <li key={f}><span className="ls-feat-dot" />{f}</li>
            ))}
          </ul>
        </div>

        <div className="ls-brand-footer">
          <p>Jalan UMS, 88400 Kota Kinabalu, Sabah</p>
          <p>pejppst@ums.edu.my · (+6088) 320000</p>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="ls-form-panel">
        <div className="ls-card">

          {/* Card header */}
          <div className="ls-card-head">
            <div className="ls-icon-wrap">🎓</div>
            <h3 className="ls-card-title">Student Login</h3>
            <p className="ls-card-sub">Sign in with your UMS Matric Number</p>
          </div>

          {/* Error */}
          {error && (
            <div className="ls-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
              
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="ls-form" noValidate>
            <div className="ls-field">
              <label className="ls-label" htmlFor="s-matric">Matric Number</label>
              <div className="ls-input-wrap">
                <span className="ls-input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  id="s-matric"
                  name="matric_staff_id"
                  type="text"
                  className="ls-input"
                  placeholder="e.g. BS2024001"
                  value={formData.matric_staff_id}
                  onChange={handleChange}
                  autoComplete="username"
                  autoFocus
                  disabled={isLoading}
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="ls-field">
              <label className="ls-label" htmlFor="s-pass">Password</label>
              <div className="ls-input-wrap">
                <span className="ls-input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="s-pass"
                  name="password"
                  type={showPass ? "text" : "password"}
                  className="ls-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button type="button" className="ls-toggle-pass"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1} aria-label="Toggle password">
                  {showPass
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit"
              className={`ls-submit ${isLoading ? "loading" : ""}`}
              disabled={isLoading}>
              {isLoading
                ? <><span className="ls-spinner" /> Signing in…</>
                : <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10 17 15 12 10 7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Sign In
                  </>
              }
            </button>
          </form>

          <p className="ls-help">
            Having trouble? Contact PPST Academic Office at{" "}
            <a href="mailto:pejppst@ums.edu.my" className="ls-staff-link">pejppst@ums.edu.my</a>
          </p>
        </div>

        {/* Info chip */}
        <div className="ls-info-chip">
          🔒 This portal is for <strong>registered UMS PPST students</strong> only.
        </div>

        <p className="ls-copyright">
          © 2025 Pusat Persediaan Sains dan Teknologi, UMS
        </p>
      </div>
    </div>
  );
};

export default LoginStudent;
