// =============================================================
// src/forms/FormWrapper.jsx — Shared form chrome + submit logic
// =============================================================
// Handles:
//   - Page header with back button
//   - Form card container
//   - Success state (shows confirmation + links)
//   - Error display
// =============================================================
import { useNavigate } from "react-router-dom";
import "./FormWrapper.css";

export const FormWrapper = ({
  code,
  title,
  subtitle,
  icon,
  color = "#003087",
  bg = "#eef2fb",
  isSubmitted,
  applicationId,
  children,
}) => {
  const navigate = useNavigate();

  if (isSubmitted) {
    return (
      <div className="form-page">
        <div className="form-success-card">
          <div className="success-icon">✅</div>
          <h2>Application Submitted!</h2>
          <p>
            Your <strong>{title}</strong> application has been submitted
            successfully and is now pending review by the Admin.
          </p>
          {applicationId && (
            <div className="success-id">
              Application ID: <strong>#{applicationId}</strong>
            </div>
          )}
          <div className="success-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/student/track/${applicationId}`)}
            >
              Track This Application
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate("/student")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      {/* Back Navigation */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* Form Header */}
      <div className="form-page-header">
        <div
          className="form-page-icon"
          style={{ background: bg, color }}
        >
          {icon}
        </div>
        <div>
          <span
            className="form-page-code"
            style={{ color }}
          >
            {code}
          </span>
          <h1 className="form-page-title">{title}</h1>
          <p className="form-page-subtitle">{subtitle}</p>
        </div>
      </div>

      {/* Form Body */}
      <div className="form-card">{children}</div>
    </div>
  );
};

// --- Reusable field components ---
export const FormField = ({ label, required, hint, children, error }) => (
  <div className={`field-group ${error ? "field-error" : ""}`}>
    <label className="field-label">
      {label}
      {required && <span className="required-star">*</span>}
    </label>
    {children}
    {hint && <p className="field-hint">{hint}</p>}
    {error && <p className="field-error-msg">{error}</p>}
  </div>
);

export const FormInput = (props) => (
  <input className="form-control" {...props} />
);

export const FormTextarea = (props) => (
  <textarea className="form-control form-textarea" rows={4} {...props} />
);

export const FormSelect = ({ children, ...props }) => (
  <select className="form-control" {...props}>{children}</select>
);

export const FormSection = ({ title, children }) => (
  <div className="form-section">
    <h3 className="form-section-title">{title}</h3>
    <div className="form-section-body">{children}</div>
  </div>
);

export const FormRow = ({ children }) => (
  <div className="form-row">{children}</div>
);

export const FileUploadField = ({ label, name, accept, required, hint, onChange, currentFile }) => (
  <div className="field-group">
    <label className="field-label">
      {label}
      {required && <span className="required-star">*</span>}
    </label>
    <div className="file-upload-area">
      <input
        type="file"
        name={name}
        id={name}
        accept={accept || ".pdf,.jpg,.jpeg,.png"}
        onChange={onChange}
        className="file-input"
      />
      <label htmlFor={name} className="file-upload-label">
        <span className="file-icon">📎</span>
        {currentFile
          ? <span className="file-name">{currentFile.name}</span>
          : <span className="file-placeholder">Click to upload or drag & drop<br /><small>PDF, JPG, PNG — max 10MB</small></span>
        }
      </label>
    </div>
    {hint && <p className="field-hint">{hint}</p>}
  </div>
);

export const SubmitSection = ({ isLoading, onCancel, submitLabel = "Submit Application", error }) => (
  <div className="submit-section">
    {error && <div className="submit-error">{error}</div>}
    <div className="submit-actions">
      <button type="button" className="btn btn-outline" onClick={onCancel} disabled={isLoading}>
        Cancel
      </button>
      <button type="submit" className="btn btn-primary" disabled={isLoading}>
        {isLoading ? <><span className="btn-spinner" />&nbsp;Submitting…</> : submitLabel}
      </button>
    </div>
    <p className="submit-note">
      ⓘ Your application will be reviewed by the Admin within 1–2 working days.
    </p>
  </div>
);

export default FormWrapper;
