// =============================================================
// models/FormApplication.js
// =============================================================
// All 6 form types live in ONE collection.
// Form-specific data is embedded as optional sub-documents
// based on the form_type field.
// This replaces the 5 separate MySQL tables.
// =============================================================
const mongoose = require("mongoose");

// ── Sick Leave sub-doc (PPST/AKD-06) ──
const sickLeaveSchema = new mongoose.Schema({
  hospital_type: { type: String, enum: ["government", "private"] },
  hospital_name: String,
  mc_file_path:  String,
}, { _id: false });

// ── Appeal Review sub-doc (PPST/AKD-03) ──
const appealReviewSchema = new mongoose.Schema({
  receipt_no:    String,
  amount_paid:   Number,
  semester:      Number,
  session:       String,
  course_code:   String,
  course_name:   String,
  grade:         String,
  lecturer_name: String,
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

  // Tier 1 — Admin
  admin_id:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  admin_comment:     String,
  admin_approved_at: Date,

  // Tier 2 — Pengarah
  pengarah_id:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  pengarah_comment:     String,
  pengarah_approved_at: Date,
  signature_path:       String,

  // Form-specific embedded data
  sick_leave_data:    sickLeaveSchema,
  appeal_review_data: appealReviewSchema,

}, { timestamps: true });

// Index for fast filtering
formApplicationSchema.index({ user_id: 1, status: 1 });
formApplicationSchema.index({ status: 1, form_type: 1 });

module.exports = mongoose.model("FormApplication", formApplicationSchema);
