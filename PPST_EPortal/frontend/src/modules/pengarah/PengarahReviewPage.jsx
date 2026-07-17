// =============================================================
// src/modules/pengarah/PengarahReviewPage.jsx
// Full application detail + draw-your-signature canvas pad
// "Approve & Sign" saves the signature PNG to the server
// =============================================================
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge, { FORM_LABELS } from "../../components/StatusBadge";
import "./PengarahReviewPage.css";

// =============================================================
// Signature Canvas Component
// =============================================================
const SignatureCanvas = ({ onSignatureChange, disabled }) => {
  const canvasRef  = useRef(null);
  const isDrawing  = useRef(false);
  const lastPos    = useRef(null);
  const hasSigned  = useRef(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  };

  const startDraw = (e) => {
    if (disabled) return;
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    if (!isDrawing.current || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pos    = getPos(e, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a2340";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();

    lastPos.current = pos;
    hasSigned.current = true;
    onSignatureChange(canvas.toDataURL("image/png"));
  };

  const stopDraw = () => { isDrawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSigned.current = false;
    onSignatureChange(null);
  };

  return (
    <div className="sig-wrap">
      <div className="sig-label-row">
        <span className="sig-label">Draw your signature below</span>
        {!disabled && (
          <button type="button" className="sig-clear-btn" onClick={clearCanvas}>
            ✕ Clear
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={520}
        height={160}
        className={`sig-canvas ${disabled ? "disabled" : ""}`}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      <p className="sig-hint">
        {disabled
          ? "Signature already recorded."
          : "Sign above using your mouse or touch screen. This signature will be saved with the approved application."}
      </p>
    </div>
  );
};

// =============================================================
// Main Review Page
// =============================================================
const PengarahReviewPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDownloadPDF = () => {
    const token = localStorage.getItem("ppst_token");
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

  const [app,          setApp]          = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [action,       setAction]       = useState(null); // 'approve' | 'reject'
  const [comment,      setComment]      = useState("");
  const [signatureData, setSignatureData] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [actionError,  setActionError]  = useState("");
  const [actionDone,   setActionDone]   = useState(false);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await api.get(`/pengarah/applications/${id}`);
        setApp(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Application not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [id]);

  const handleSignatureChange = useCallback((dataUrl) => {
    setSignatureData(dataUrl);
  }, []);

  const handleAction = async () => {
    setActionError("");

    if (action === "approve" && !signatureData) {
      setActionError("Please draw your signature before approving.");
      return;
    }
    if (action === "reject" && !comment.trim()) {
      setActionError("Please provide a rejection reason.");
      return;
    }

    setSubmitting(true);
    try {
      const body = { comment: comment.trim() };
      if (action === "approve" && signatureData) {
        body.signature_data = signatureData;
      }
      await api.patch(`/pengarah/applications/${id}/${action}`, body);
      setActionDone(true);
      // Refresh
      const res = await api.get(`/pengarah/applications/${id}`);
      setApp(res.data.data);
    } catch (err) {
      setActionError(err.response?.data?.message || "Action failed. Please try again.");
    } finally {
      setSubmitting(false);
      if (!actionError) setAction(null);
    }
  };

  if (loading) return <div className="prp-state"><div className="loading-spinner" />Loading…</div>;
  if (error)   return <div className="prp-state error">{error}</div>;
  if (!app)    return null;

  const isPending  = app.status === "pending_pengarah";
  const fileUrl    = (app.file_path || app.mc_file_path)
    ? `${app.file_path || app.mc_file_path}`
    : null;
  const sigUrl     = app.signature_path
    ? `${app.signature_path}`
    : null;

  return (
    <div className="prp-page">
      <button className="prp-back" onClick={() => navigate("/pengarah/approvals")}>
        ← Back to Approval Queue
      </button>

      {/* Header */}
      <div className="prp-header">
        <div>
          <span className="prp-app-id">Application #{app.id}</span>
          <h1 className="prp-title">{FORM_LABELS[app.form_type]}</h1>
        </div>
        <div className="prp-header-right">
          <StatusBadge status={app.status} />
          {actionDone && <span className="prp-done-chip">✓ Decision recorded</span>}
          <button className="prp-pdf-btn" onClick={handleDownloadPDF}>
            📄 Download PDF
          </button>
        </div>
      </div>

      <div className="prp-body">
        {/* LEFT — Application Details */}
        <div className="prp-left">

          {/* Student Info */}
          <div className="prp-card">
            <h3 className="prp-card-title">Student Information</h3>
            <div className="prp-grid">
              <DR label="Full Name"    value={app.student_name} />
              <DR label="Matric No."   value={app.student_matric} />
              <DR label="Programme"    value={app.program} />
              <DR label="IC Number"    value={app.student_ic} />
              <DR label="Email"        value={app.student_email} />
              <DR label="Phone"        value={app.student_phone} />
              <DR label="Lec. Group"   value={app.lecture_group} />
              <DR label="Tut. Group"   value={app.tutorial_group} />
              {app.address && <DR label="Address" value={app.address} full />}
            </div>
          </div>

          {/* Application Details */}
          <div className="prp-card">
            <h3 className="prp-card-title">Application Details</h3>
            <div className="prp-grid">
              <DR label="Form Type"    value={FORM_LABELS[app.form_type]} />
              <DR label="Submitted"    value={new Date(app.submitted_at).toLocaleString("en-MY")} />
              {app.start_date && <DR label="From Date" value={new Date(app.start_date).toLocaleDateString("en-MY")} />}
              {app.end_date   && <DR label="To Date"   value={new Date(app.end_date).toLocaleDateString("en-MY")} />}
              <DR label="Reason / Details" value={app.reason} full />
              {app.hospital_name && <>
                <DR label="Hospital"  value={app.hospital_name} />
                <DR label="Type"      value={app.hospital_type} />
              </>}
              {app.course_code && <>
                <DR label="Course Code" value={app.course_code} />
                <DR label="Grade"       value={app.grade} />
                <DR label="Course Name" value={app.course_name} full />
                <DR label="Lecturer"    value={app.appeal_lecturer} />
                <DR label="Receipt No." value={app.receipt_no} />
                <DR label="Amount Paid" value={`RM ${Number(app.amount_paid||0).toFixed(2)}`} />
              </>}
            </div>
            {fileUrl && (
              <div className="prp-attachment">
                <a href={fileUrl} target="_blank" rel="noreferrer" className="prp-file-link">
                  📎 View Uploaded Document
                </a>
              </div>
            )}
          </div>

          {/* Admin Decision */}
          <div className="prp-card">
            <h3 className="prp-card-title">Admin Review (Tier 1)</h3>
            <div className="prp-admin-row">
              <span className="prp-admin-name">✅ Approved by <strong>{app.admin_name}</strong></span>
              <span className="prp-admin-date">
                {app.admin_approved_at
                  ? new Date(app.admin_approved_at).toLocaleString("en-MY")
                  : "—"}
              </span>
            </div>
            {app.admin_comment && (
              <div className="prp-comment-box">"{app.admin_comment}"</div>
            )}
          </div>

          {/* Existing Signature (if already approved) */}
          {sigUrl && (
            <div className="prp-card">
              <h3 className="prp-card-title">Recorded Digital Signature</h3>
              <div className="prp-sig-display">
                <img src={sigUrl} alt="Director's signature" className="prp-sig-img" />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Action Panel */}
        <div className="prp-right">
          <div className={`prp-action-panel ${!isPending ? "read-only" : ""}`}>

            {isPending ? (
              <>
                <h3 className="prp-action-title">✍️ Director's Decision</h3>
                <p className="prp-action-hint">
                  This application has been reviewed and approved by Admin.
                  Your digital signature will be stamped on approval.
                </p>

                {/* Action toggle */}
                {!action && (
                  <div className="prp-action-btns">
                    <button
                      className="prp-btn approve"
                      onClick={() => { setAction("approve"); setComment(""); setActionError(""); }}
                    >
                      ✅ Approve &amp; Sign
                    </button>
                    <button
                      className="prp-btn reject"
                      onClick={() => { setAction("reject"); setComment(""); setActionError(""); }}
                    >
                      ❌ Reject Application
                    </button>
                  </div>
                )}

                {/* Confirm panel */}
                {action && (
                  <div className={`prp-confirm-panel ${action}`}>
                    <div className="prp-confirm-header">
                      {action === "approve" ? "✅ Confirm Approval & Signature" : "❌ Confirm Rejection"}
                    </div>

                    {/* Signature pad — only for approval */}
                    {action === "approve" && (
                      <SignatureCanvas
                        onSignatureChange={handleSignatureChange}
                        disabled={false}
                      />
                    )}

                    <div className="prp-comment-field">
                      <label className="prp-comment-label">
                        {action === "reject" ? "Rejection Reason *" : "Director's Comment (optional)"}
                      </label>
                      <textarea
                        className="prp-comment-textarea"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={
                          action === "reject"
                            ? "State the reason for rejecting this application…"
                            : "Optional note attached to the approved application…"
                        }
                      />
                    </div>

                    {actionError && (
                      <div className="prp-action-error">{actionError}</div>
                    )}

                    <div className="prp-confirm-actions">
                      <button
                        className="prp-btn cancel"
                        onClick={() => { setAction(null); setActionError(""); }}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        className={`prp-btn confirm ${action}`}
                        onClick={handleAction}
                        disabled={submitting || (action === "approve" && !signatureData)}
                      >
                        {submitting
                          ? <><span className="btn-spinner" />Processing…</>
                          : action === "approve"
                            ? "Confirm & Sign"
                            : "Confirm Rejection"}
                      </button>
                    </div>

                    {action === "approve" && !signatureData && (
                      <p className="prp-sig-required">⚠️ Please draw your signature above to proceed.</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="prp-action-title">Final Decision</h3>
                <div className="prp-readonly-status">
                  <StatusBadge status={app.status} />
                  <p className="prp-readonly-msg">
                    {app.status === "fully_approved"
                      ? `Approved and signed by ${app.pengarah_name || user?.name} on ${new Date(app.pengarah_approved_at).toLocaleDateString("en-MY")}.`
                      : `Rejected by ${app.pengarah_name || user?.name}. Reason: ${app.pengarah_comment || "—"}`}
                  </p>
                  {app.pengarah_comment && app.status === "fully_approved" && (
                    <div className="prp-comment-box">{app.pengarah_comment}</div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Student Summary */}
          <div className="prp-student-card">
            <div className="prp-sc-avatar">{app.student_name?.charAt(0)}</div>
            <div className="prp-sc-info">
              <span className="prp-sc-name">{app.student_name}</span>
              <span className="prp-sc-matric">{app.student_matric}</span>
              <span className="prp-sc-prog">{app.program || "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DR = ({ label, value, full }) => (
  <div className={`prp-dr ${full ? "full" : ""}`}>
    <span className="prp-dr-label">{label}</span>
    <span className="prp-dr-value">{value || "—"}</span>
  </div>
);

export default PengarahReviewPage;
