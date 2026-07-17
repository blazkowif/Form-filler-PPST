// =============================================================
// src/modules/admin/AdminReviewPage.jsx
// Full application detail + Approve / Reject + Print button
// =============================================================
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import StatusBadge, { FORM_LABELS } from "../../components/StatusBadge";
import "./AdminReviewPage.css";

const AdminReviewPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [app,        setApp]        = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [action,     setAction]     = useState(null);
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError,setActionError]= useState("");
  const [actionDone, setActionDone] = useState(false);

  const fetchApp = async () => {
    try {
      const res = await api.get(`/admin/applications/${id}`);
      setApp(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Application not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApp(); }, [id]);

  const handleAction = async () => {
    setActionError("");
    if (action === "reject" && !comment.trim()) {
      setActionError("Please provide a rejection reason before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/admin/applications/${id}/${action}`, { comment: comment.trim() });
      setActionDone(true);
      await fetchApp();
    } catch (err) {
      setActionError(err.response?.data?.message || "Action failed. Please try again.");
    } finally {
      setSubmitting(false);
      setAction(null);
    }
  };

  const handlePrint = () => {
    window.open(`/api/print/${id}`, "_blank");
  };

  const handleDownloadPDF = () => {
      const token = sessionStorage.getItem("ppst_token");
      fetch(`/api/pdf/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.message || "PDF generation failed.");
          return;
        }
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `PPST_Form_${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert("Could not download PDF."));
  };

  if (loading) return <div className="arp-state"><div className="loading-spinner" /> Loading…</div>;
  if (error)   return <div className="arp-state error">{error}</div>;
  if (!app)    return null;

  const isPendingAdmin = app.status === "pending_admin";
  const fileUrl = (app.file_path || app.mc_file_path)
    ? `${app.file_path || app.mc_file_path}`
    : null;

  return (
    <div className="arp-page">
      <button className="arp-back" onClick={() => navigate("/admin/applications")}>
        ← Back to Applications
      </button>

      {/* Header */}
      <div className="arp-header">
        <div className="arp-header-left">
          <span className="arp-app-id">Application #{app.id || id}</span>
          <h1 className="arp-title">{FORM_LABELS[app.form_type]}</h1>
        </div>
        <div className="arp-header-right">
          <StatusBadge status={app.status} />
          {actionDone && <span className="arp-done-chip">✓ Action recorded</span>}
          <button className="arp-print-btn" onClick={handlePrint}>
            🖨️ Print Form
          </button>
          <button className="arp-print-btn pdf-btn" onClick={handleDownloadPDF}>
            📄 Download PDF
          </button>
        </div>
      </div>

      <div className="arp-body">
        {/* LEFT — Details */}
        <div className="arp-left">

          {/* Student Info */}
          <div className="arp-card">
            <h3 className="arp-card-title">Student Information</h3>
            <div className="arp-detail-grid">
              <DetailRow label="Full Name"    value={app.student_name} />
              <DetailRow label="Matric No."   value={app.student_matric} />
              <DetailRow label="Programme"    value={app.program} />
              <DetailRow label="IC Number"    value={app.student_ic} />
              <DetailRow label="Email"        value={app.student_email} />
              <DetailRow label="Phone"        value={app.student_phone} />
              <DetailRow label="Lec. Group"   value={app.lecture_group} />
              <DetailRow label="Tut. Group"   value={app.tutorial_group} />
              {app.address && <DetailRow label="Address" value={app.address} fullWidth />}
            </div>
          </div>

          {/* Application Details */}
          <div className="arp-card">
            <h3 className="arp-card-title">Application Details</h3>
            <div className="arp-detail-grid">
              <DetailRow label="Form Type"  value={FORM_LABELS[app.form_type]} />
              <DetailRow label="Submitted"  value={app.submitted_at ? new Date(app.submitted_at).toLocaleString("en-MY") : new Date(app.createdAt).toLocaleString("en-MY")} />
              {app.start_date && <DetailRow label="From Date" value={new Date(app.start_date).toLocaleDateString("en-MY")} />}
              {app.end_date   && <DetailRow label="To Date"   value={new Date(app.end_date).toLocaleDateString("en-MY")} />}
              <DetailRow label="Reason / Details" value={app.reason} fullWidth />

              {/* Sick leave */}
              {app.hospital_name && <>
                <DetailRow label="Hospital / Clinic" value={app.hospital_name} />
                <DetailRow label="Type" value={app.hospital_type === "government" ? "Government / Kerajaan" : "Private / Swasta"} />
              </>}

              {/* Appeal */}
              {app.course_code && <>
                <DetailRow label="Course Code"   value={app.course_code} />
                <DetailRow label="Course Name"   value={app.course_name} />
                <DetailRow label="Grade"         value={app.grade} />
                <DetailRow label="Lecturer"      value={app.appeal_lecturer} />
                <DetailRow label="Semester"      value={app.semester} />
                <DetailRow label="Session"       value={app.appeal_session} />
                <DetailRow label="Receipt No."   value={app.receipt_no} />
                <DetailRow label="Amount Paid"   value={`RM ${Number(app.amount_paid || 0).toFixed(2)}`} />
              </>}
            </div>

            {fileUrl && (
              <div className="arp-attachment">
                <a href={fileUrl} target="_blank" rel="noreferrer" className="arp-file-link">
                  📎 View Uploaded Document
                </a>
              </div>
            )}
          </div>

          {/* Approval History */}
          {(app.admin_name || app.pengarah_name) && (
            <div className="arp-card">
              <h3 className="arp-card-title">Approval History</h3>
              {app.admin_name && (
                <div className="arp-history-item">
                  <span className="arp-history-role">Admin Review</span>
                  <span className="arp-history-name">{app.admin_name}</span>
                  <span className="arp-history-date">
                    {app.admin_approved_at ? new Date(app.admin_approved_at).toLocaleString("en-MY") : "—"}
                  </span>
                  {app.admin_comment && <span className="arp-history-comment">"{app.admin_comment}"</span>}
                </div>
              )}
              {app.pengarah_name && (
                <div className="arp-history-item">
                  <span className="arp-history-role">Pengarah Decision</span>
                  <span className="arp-history-name">{app.pengarah_name}</span>
                  <span className="arp-history-date">
                    {app.pengarah_approved_at ? new Date(app.pengarah_approved_at).toLocaleString("en-MY") : "—"}
                  </span>
                  {app.pengarah_comment && <span className="arp-history-comment">"{app.pengarah_comment}"</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Action Panel */}
        <div className="arp-right">
          <div className={`arp-action-panel ${!isPendingAdmin ? "read-only" : ""}`}>
            {isPendingAdmin ? (
              <>
                <h3 className="arp-action-title">⚖️ Admin Decision</h3>
                <p className="arp-action-hint">
                  Review the application on the left, then approve (forwards to Pengarah) or reject with a reason.
                </p>

                {!action && (
                  <div className="arp-action-btns">
                    <button className="arp-btn approve"
                      onClick={() => { setAction("approve"); setComment(""); setActionError(""); }}>
                      ✅ Approve & Forward to Pengarah
                    </button>
                    <button className="arp-btn reject"
                      onClick={() => { setAction("reject"); setComment(""); setActionError(""); }}>
                      ❌ Reject Application
                    </button>
                  </div>
                )}

                {action && (
                  <div className={`arp-confirm-panel ${action}`}>
                    <div className="arp-confirm-header">
                      {action === "approve" ? "✅ Confirm Approval" : "❌ Confirm Rejection"}
                    </div>
                    <div className="arp-comment-field">
                      <label className="arp-comment-label">
                        {action === "reject" ? "Rejection Reason *" : "Comment (optional)"}
                      </label>
                      <textarea className="arp-comment-textarea" rows={4}
                        value={comment} onChange={e => setComment(e.target.value)}
                        placeholder={action === "reject"
                          ? "Provide a clear reason for rejection…"
                          : "Optional note for the Pengarah…"} />
                    </div>

                    {actionError && <div className="arp-action-error">{actionError}</div>}

                    <div className="arp-confirm-actions">
                      <button className="arp-btn cancel"
                        onClick={() => { setAction(null); setActionError(""); }} disabled={submitting}>
                        Cancel
                      </button>
                      <button className={`arp-btn confirm ${action}`}
                        onClick={handleAction} disabled={submitting}>
                        {submitting
                          ? <><span className="btn-spinner" />&nbsp;Processing…</>
                          : action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="arp-action-title">Review Status</h3>
                <div className="arp-readonly-status">
                  <StatusBadge status={app.status} />
                  <p className="arp-readonly-msg">
                    {app.status === "pending_pengarah" && "Approved by Admin — awaiting Pengarah's final decision."}
                    {app.status === "fully_approved"   && "Fully approved by the Pengarah."}
                    {app.status === "rejected"         && `Rejected. Reason: ${app.admin_comment || app.pengarah_comment || "—"}`}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Student Summary Card */}
          <div className="arp-student-summary">
            <div className="ass-avatar">{app.student_name?.charAt(0)}</div>
            <div className="ass-info">
              <span className="ass-name">{app.student_name}</span>
              <span className="ass-matric">{app.student_matric}</span>
              <span className="ass-program">{app.program || "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, fullWidth }) => (
  <div className={`arp-detail-row ${fullWidth ? "full-width" : ""}`}>
    <span className="arp-dr-label">{label}</span>
    <span className="arp-dr-value">{value || "—"}</span>
  </div>
);

export default AdminReviewPage;
