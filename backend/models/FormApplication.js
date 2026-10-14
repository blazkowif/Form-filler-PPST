// =============================================================
// models/FormApplication.js
// =============================================================
// All 6 form types live in ONE collection.
// Form-specific data is embedded as optional sub-documents
// based on the form_type field.
// This replaces the 5 separate MySQL tables.
// =============================================================
const mongoose = require("mongoose");
const SequenceCounter = require("./SequenceCounter");

const FORM_REFERENCE_CODES = {
  withdrawal: "AKD-01",
  exam_replacement: "AKD-02",
  appeal_review: "AKD-03",
  non_sick_leave: "AKD-04",
  room_booking: "AKD-05",
  sick_leave: "AKD-06",
};

// ── Sick Leave sub-doc (PPST/AKD-06) ──
const sickLeaveSchema = new mongoose.Schema({
  hospital_type: { type: String, enum: ["government", "private"] },
  hospital_name: String,
  mc_file_path:  String,
}, { _id: false });

// ── Appeal Review sub-doc (PPST/AKD-03) ──
const appealReviewSchema = new mongoose.Schema({
  receipt_no:    String,
  receipt_date:  String,
  amount_paid:   Number,
  semester:      Number,
  session:       String,
  course_code:   String,
  course_name:   String,
  grade:         String,
  lecturer_name: String,
  faculty:       String,
}, { _id: false });

// ── Main Application Schema ──
const formApplicationSchema = new mongoose.Schema({
  // Who submitted
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Form type
  form_type: {
    type: String,
    enum: [
      "sick_leave", "non_sick_leave", "appeal_review",
      "withdrawal", "exam_replacement", "room_booking",
    ],
    required: true,
  },
  reference_no: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },

  // Status
  status: {
    type: String,
    enum: ["pending_admin", "pending_pengarah", "fully_approved", "rejected"],
    default: "pending_admin",
  },

  // Common fields
  reason:     String,
  start_date: Date,
  end_date:   Date,
  file_path:  String,

  // Form-specific top-level fields used by the PDF filler
  withdrawal_reason: String,
  institution_name:   String,
  withdrawal_detail:  String,
  room_choice:        String,
  applicant_position: String,
  exam_reason:        String,
  exam_date:          Date,
  class_group:        String,
  course_code:        String,
  course_name:        String,
  grade:              String,
  lecturer_name:      String,
  faculty:            String,
  centre:             String,
  semester:           String,
  session:            String,

  // Tier 1 — Admin
  admin_id:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  admin_comment:     String,
  admin_approved_at: Date,

  // Tier 2 — Pengarah
  pengarah_id:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  pengarah_comment:     String,
  pengarah_approved_at: Date,
  signature_path:       String,

  // Optional TPA review data for forms that include a TPA section.
  tpa_id:              { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tpa_comment:         String,
  tpa_date:            Date,
  tpa_signature_path:  String,

  // Form-specific embedded data
  withdrawal_data:   mongoose.Schema.Types.Mixed,
  room_booking_data: mongoose.Schema.Types.Mixed,
  sick_leave_data:    sickLeaveSchema,
  appeal_review_data: appealReviewSchema,

}, { timestamps: true });

// Index for fast filtering
formApplicationSchema.index({ user_id: 1, status: 1 });
formApplicationSchema.index({ status: 1, form_type: 1 });

formApplicationSchema.pre("save", async function assignReferenceNumber(next) {
  if (!this.isNew || this.reference_no) return next();

  const year = (this.createdAt || new Date()).getFullYear();
  const formCode = FORM_REFERENCE_CODES[this.form_type];
  if (!formCode) return next(new Error(`Cannot assign reference number for form type "${this.form_type}".`));

  const counter = await SequenceCounter.findOneAndUpdate(
    { key: `${year}:${formCode}` },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  this.reference_no = `PPST/${formCode}/${year}/${String(counter.value).padStart(4, "0")}`;
  next();
});

module.exports = mongoose.model("FormApplication", formApplicationSchema);
