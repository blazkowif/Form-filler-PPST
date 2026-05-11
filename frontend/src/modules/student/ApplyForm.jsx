// =============================================================
// src/modules/student/ApplyForm.jsx
// Acts as the router between form-type selector and the 6 forms.
// Route: /student/apply             → Form selector grid
//        /student/apply/:form_type  → Specific form
// =============================================================
import { useParams, useNavigate } from "react-router-dom";
import SickLeaveForm from "../../forms/SickLeaveForm";
import {
  NonSickLeaveForm,
  AppealReviewForm,
  WithdrawalForm,
  ExamReplacementForm,
  RoomBookingForm,
} from "../../forms/OtherForms";
import "./ApplyForm.css";

const FORM_REGISTRY = {
  sick_leave:       <SickLeaveForm />,
  non_sick_leave:   <NonSickLeaveForm />,
  appeal_review:    <AppealReviewForm />,
  withdrawal:       <WithdrawalForm />,
  exam_replacement: <ExamReplacementForm />,
  room_booking:     <RoomBookingForm />,
};

const FORM_CARDS = [
  { key:"sick_leave",       code:"PPST/AKD-06", icon:"🏥", title:"Sick Leave",                color:"#dc2626", bg:"#fff5f5",
    desc:"Absent due to illness. Attach MC." },
  { key:"non_sick_leave",   code:"PPST/AKD-07", icon:"📅", title:"Non-Sick Leave",             color:"#d97706", bg:"#fffbeb",
    desc:"Absent for non-medical reasons." },
  { key:"appeal_review",    code:"PPST/AKD-03", icon:"📝", title:"Appeal Exam Review",         color:"#2563eb", bg:"#eff6ff",
    desc:"Review your examination result. RM100/course." },
  { key:"withdrawal",       code:"PPST/AKD-01", icon:"🎓", title:"Withdrawal from Studies",    color:"#7c3aed", bg:"#f5f3ff",
    desc:"Apply to discontinue your studies." },
  { key:"exam_replacement", code:"PPST/AKD-02", icon:"✏️", title:"Replacement / Repeat Exam", color:"#059669", bg:"#ecfdf5",
    desc:"Missed exam? Apply within 48 hours." },
  { key:"room_booking",     code:"PPST/AKD-05", icon:"🏛️", title:"Room Booking",              color:"#0891b2", bg:"#ecfeff",
    desc:"Book a lecture or tutorial room." },
];

const ApplyForm = () => {
  const { form_type } = useParams();
  const navigate       = useNavigate();

  // Render the specific form if a type is in the URL
  if (form_type) {
    const FormComponent = FORM_REGISTRY[form_type];
    if (!FormComponent) {
      return (
        <div className="apply-page">
          <div className="apply-not-found">
            <span>❓</span>
            <p>Unknown form type: <code>{form_type}</code></p>
            <button className="btn-back" onClick={() => navigate("/student/apply")}>
              ← Back to Form Selection
            </button>
          </div>
        </div>
      );
    }
    return <div className="apply-page">{FormComponent}</div>;
  }

  // Default: show the form selection grid
  return (
    <div className="apply-page">
      <div className="apply-header">
        <h1 className="apply-title">📋 Apply for a Form</h1>
        <p className="apply-subtitle">
          Select the form type you wish to submit. All forms go through a
          2-tier approval process: Admin → Pengarah.
        </p>
      </div>

      <div className="apply-grid">
        {FORM_CARDS.map((card) => (
          <button
            key={card.key}
            className="apply-card"
            style={{ "--ac": card.color, "--ab": card.bg }}
            onClick={() => navigate(`/student/apply/${card.key}`)}
          >
            <div className="ac-icon" style={{ background: card.bg }}>{card.icon}</div>
            <div className="ac-body">
              <span className="ac-code">{card.code}</span>
              <span className="ac-title">{card.title}</span>
              <span className="ac-desc">{card.desc}</span>
            </div>
            <span className="ac-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ApplyForm;
