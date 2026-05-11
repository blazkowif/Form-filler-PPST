// =============================================================
// src/components/StatusBadge.jsx — Application Status Badge
// =============================================================
import "./StatusBadge.css";

const STATUS_CONFIG = {
  pending_admin: {
    label: "Pending Admin",
    className: "badge--pending-admin",
    icon: "⏳",
  },
  pending_pengarah: {
    label: "Pending Pengarah",
    className: "badge--pending-pengarah",
    icon: "📋",
  },
  fully_approved: {
    label: "Approved",
    className: "badge--approved",
    icon: "✅",
  },
  rejected: {
    label: "Rejected",
    className: "badge--rejected",
    icon: "❌",
  },
};

const FORM_LABELS = {
  sick_leave:       "Sick Leave (AKD-06)",
  non_sick_leave:   "Non-Sick Leave (AKD-07)",
  appeal_review:    "Appeal Exam Review (AKD-03)",
  withdrawal:       "Withdrawal (AKD-01)",
  exam_replacement: "Replacement Exam (AKD-02)",
  room_booking:     "Room Booking (AKD-05)",
};

export const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status, className: "badge--default", icon: "•" };
  return (
    <span className={`status-badge ${config.className}`}>
      <span className="badge-icon">{config.icon}</span>
      {config.label}
    </span>
  );
};

export const FormTypeLabel = ({ formType }) => (
  <span className="form-type-label">
    {FORM_LABELS[formType] || formType}
  </span>
);

export { STATUS_CONFIG, FORM_LABELS };
export default StatusBadge;
