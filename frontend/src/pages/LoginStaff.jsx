// =============================================================
// src/pages/LoginStaff.jsx
// Route: /login/staff  →  Admin, Pengarah, Lecturer only
// Role is AUTO-DETECTED from their Staff ID — no dropdown needed
// Rejects students with a clear redirect message
// =============================================================
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginStaff.css";

const STAFF_ROLES   = ["admin", "lecturer", "pengarah"];
const ROLE_REDIRECT = { admin: "/admin", lecturer: "/lecturer", pengarah: "/pengarah" };

const ROLE_LABELS = {
  admin:    { label: "Administrator",  icon: "⚙️",  color: "#92400e" },
  lecturer: { label: "Lecturer",       icon: "📚",  color: "#065f46" },
  pengarah: { label: "Pengarah",       icon: "🏛️", color: "#4c1d95" },
};

const LoginStaff = () => {
  const navigate        = useNavigate();
  const { login, user } = useAuth();

  const [formData, setFormData]     = useState({ matric_staff_id: "", password: "" });
  const [showPass, setShowPass]     = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState("");
  const [detectedRole, setDetected] = useState(null); // shown after successful detect

  // Already logged in as staff → go to their dashboard
  useEffect(() => {
    if (user && STAFF_ROLES.includes(user.role)) {
      navigate(ROLE_REDIRECT[user.role], { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError("");
    if (detectedRole) setDetected(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.matric_staff_id.trim()) { setError("Please enter your Staff ID."); return; }
    if (!formData.password)               { setError("Please enter your password."); return; }

    setIsLoading(true);
    const result = await login(formData.matric_staff_id.trim(), formData.password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    // Role guard — reject students trying to use staff login
    if (result.user.role === "student") {
      setError(
        "This portal is for PPST staff only. Students please use the Student Login page."
      );
      sessionStorage.removeItem("ppst_token");
      sessionStorage.removeItem("ppst_user");
      return;
    }

    // Show the detected role briefly before redirecting
    setDetected(result.user.role);
    setTimeout(() => {
      navigate(ROLE_REDIRECT[result.user.role], { replace: true });
    }, 900);
  };

  return (
    <div className="lsf-page">
      {/* ── Left Branding Panel ── */}
      <div className="lsf-brand">
        <div className="lsf-brand-content">
          <div className="lsf-crest">UMS</div>
          <h1 className="lsf-uni-name">Universiti Malaysia Sabah</h1>
          <div className="lsf-divider" />
          <h2 className="lsf-centre-name">Pusat Persediaan Sains dan Teknologi</h2>
          <p className="lsf-centre-sub">Preparatory Centre for Science &amp; Technology</p>

          <div className="lsf-portal-tag">
            <span className="lsf-portal-dot" />
            PPST E-Portal 2025 — Staff Access
          </div>

          {/* Staff role cards */}
          <div className="lsf-role-cards">
            {[
              { role:"admin",    icon:"⚙️",  label:"Administrator",   desc:"Tier 1 approver" },
              { role:"lecturer", icon:"📚",  label:"Lecturer",         desc:"Class & attendance" },
              { role:"pengarah", icon:"🏛️", label:"Pengarah",          desc:"Tier 2 approver" },
            ].map((r) => (
              <div key={r.role} className="lsf-role-card">
                <span className="lsf-rc-icon">{r.icon}</span>
                <div>
                  <span className="lsf-rc-label">{r.label}</span>
                  <span className="lsf-rc-desc">{r.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lsf-brand-footer">
          <p>Staff access only · Role is auto-detected from your Staff ID</p>
          <p>pejppst@ums.edu.my · (+6088) 320000</p>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="lsf-form-panel">
        <div className="lsf-card">

          {/* Card header */}
          <div className="lsf-card-head">
            <div className="lsf-icon-wrap">🔐</div>
            <h3 className="lsf-card-title">Staff Login</h3>
            <p className="lsf-card-sub">
              Your role is automatically detected from your Staff ID
            </p>
          </div>

          {/* Detected role banner */}
          {detectedRole && (
            <div className="lsf-role-banner">
              <span className="lsf-rb-icon">{ROLE_LABELS[detectedRole]?.icon}</span>
              <div>
                <span className="lsf-rb-title">
                  {ROLE_LABELS[detectedRole]?.label} detected
                </span>
                <span className="lsf-rb-sub">Redirecting to your dashboard…</span>
              </div>
              <span className="lsf-rb-spinner" />
            </div>
          )}

          {/* Error */}
          {error && !detectedRole && (
            <div className="lsf-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>
                {error}
                
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="lsf-form" noValidate>
            <div className="lsf-field">
              <label className="lsf-label" htmlFor="sf-id">Staff ID</label>
              <div className="lsf-input-wrap">
                <span className="lsf-input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                    <line x1="12" y1="12" x2="12" y2="16"/>
                    <circle cx="12" cy="12" r="1" fill="currentColor"/>
                  </svg>
                </span>
                <input
                  id="sf-id"
                  name="matric_staff_id"
                  type="text"
                  className="lsf-input"
                  placeholder="e.g. ADMIN001 · LEC001 · PEN001"
                  value={formData.matric_staff_id}
                  onChange={handleChange}
                  autoComplete="username"
                  autoFocus
                  disabled={isLoading || !!detectedRole}
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="lsf-field">
              <label className="lsf-label" htmlFor="sf-pass">Password</label>
              <div className="lsf-input-wrap">
                <span className="lsf-input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="sf-pass"
                  name="password"
                  type={showPass ? "text" : "password"}
                  className="lsf-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={isLoading || !!detectedRole}
                />
                <button type="button" className="lsf-toggle-pass"
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
              className={`lsf-submit ${isLoading || detectedRole ? "loading" : ""}`}
              disabled={isLoading || !!detectedRole}>
              {isLoading
                ? <><span className="lsf-spinner" /> Verifying credentials…</>
                : detectedRole
                  ? <><span className="lsf-spinner" /> Redirecting…</>
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

          <p className="lsf-help">
            Having trouble? Contact PPST Academic Office at{" "}
            <a href="mailto:pejppst@ums.edu.my" className="lsf-student-link">pejppst@ums.edu.my</a>
          </p>
        </div>

        {/* Info chip */}
        <div className="lsf-info-chip">
          🔒 Restricted to <strong>PPST staff</strong> — Admin, Lecturer &amp; Pengarah only.
          <br />Your role is detected automatically from your Staff ID.
        </div>

        <p className="lsf-copyright">
          © 2025 Pusat Persediaan Sains dan Teknologi, UMS
        </p>
      </div>
    </div>
  );
};

export default LoginStaff;
