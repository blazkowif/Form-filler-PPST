// =============================================================
// routes/pdfFillRoutes.js
// Calls pdf_filler.js (Node.js + pdf-lib) to overlay
// student data onto the original AKD-XX.pdf template and
// stream the filled PDF back to the browser.
// =============================================================
const express = require("express");
const FormApplication = require("../models/FormApplication");
const { protect } = require("../middleware/authMiddleware");
const { fillPdf } = require("../pdf_filler");

const router = express.Router();
router.use(protect);

// ─────────────────────────────────────────────────────────────
// Helper — build a flat JSON payload for the PDF filler
// ─────────────────────────────────────────────────────────────
const buildPayload = (app, user) => {
  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

  const profile = user?.profile || {};
  const appeal = app.appeal_review_data || {};
  const room = app.room_booking_data || {};
  const studentDate = fmt(app.createdAt);
  const adminDate = fmt(app.admin_approved_at);
  const directorDate = fmt(app.pengarah_approved_at);
  const courseCode = appeal.course_code || app.course_code || "";
  const courseName = appeal.course_name || app.course_name || "";

  return {
    student_name: user?.name || "",
    student_no: user?.matric_staff_id || "",
    matric_no: user?.matric_staff_id || "",
    programme: profile.program || "",
    phone_no: user?.phone || profile.phone || "",
    ic_number: user?.ic_number || "",
    centre: "PPST",
    faculty: profile.faculty || "PPST",
    address: profile.address || "",
    withdrawal_reason: app.withdrawal_reason || "",
    institution_name: app.institution_name || "",
    semester: appeal.semester || app.semester || "",
    session: appeal.session || app.session || "",
    exam_reason: app.exam_reason || "",
    course_row_1_code: courseCode,
    course_row_1_name: courseName,
    course_row_1_exam_dt: fmt(app.exam_date || app.start_date),
    receipt_no: appeal.receipt_no || "",
    receipt_date: appeal.receipt_date || "",
    amount_paid: appeal.amount_paid !== undefined && appeal.amount_paid !== null
      ? `RM ${Number(appeal.amount_paid).toFixed(2)}` : "",
    course_row_1_grade: appeal.grade || app.grade || "",
    course_row_1_lecturer: appeal.lecturer_name || app.lecturer_name || "",
    course_row_1_offering_centre: appeal.faculty || app.faculty || profile.faculty || "PPST",
    reason_text: app.reason || "",
    date_of_absence: fmt(app.start_date),
    applicant_name: user?.name || "",
    position: app.applicant_position || "Pelajar",
    room_choice: app.room_choice || "",
    purpose: app.reason || "",
    booking_date: fmt(app.start_date),
    Others_rooms: room.room_type === "Other" ? (room.other_room || room.other_rooms || "Other") : "",
    bil: courseCode ? "1" : "",
    class_group: app.class_group || profile.lecture_group || "",
    hospital_type: app.sick_leave_data?.hospital_type || "",
    student_date: studentDate,
    student_signature_date: studentDate,
    student_signature: user?.name || "",
    approval_status: app.status || "",
    director_comments: app.pengarah_comment || app.admin_comment || "",
    director_date: directorDate || adminDate,
    director_signature: app.signature_path || app.pengarah_id?.name || "",
    Director_stamp: app.signature_path || app.pengarah_id?.name || "",
    staff_name: app.admin_id?.name || "",
    staff_received_name: app.admin_id?.name || "",
    form_date_received: adminDate,
    Form_date_received: adminDate,
    TPA_signature: app.tpa_signature_path || app.tpa_id?.name || "",
    TPA_comment: app.tpa_comment || "",
    TPA_date: fmt(app.tpa_date),
  };
};

// ─────────────────────────────────────────────────────────────
// GET /api/pdf/:appId
// ─────────────────────────────────────────────────────────────
router.get("/:appId", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(req.params.appId)) {
      return res.status(400).json({ success: false, message: "Invalid application ID." });
    }

    const app = await FormApplication.findById(req.params.appId)
      .populate("user_id", "name matric_staff_id phone ic_number profile")
      .populate("admin_id", "name")
      .populate("pengarah_id", "name")
      .populate("tpa_id", "name")
      .lean();

    if (!app) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    // Authorisation: student sees own doc; staff sees all
    const isOwner = app.user_id?._id?.toString() === req.user.id;
    const isStaff = ["admin", "pengarah", "lecturer"].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }

    const payload = buildPayload(app, app.user_id);
    const formType = app.form_type;
    const filename = `PPST_${formType}_${app.user_id?.matric_staff_id || "form"}.pdf`;

    const pdfBytes = await fillPdf(formType, payload);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBytes.length);
    res.end(pdfBytes);

  } catch (err) {
    console.error("❌ pdfFillRoute:", err.message);
    if (!res.headersSent) {
      // Error code 2 = template missing
      if (err.message.includes("Template not found")) {
        return res.status(404).json({
          success: false,
          message: "PDF template not found in backend/assets/forms/. Please upload the original form PDFs.",
        });
      }
      res.status(500).json({
        success: false,
        message: "PDF generation failed.",
        detail: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }
});

module.exports = router;
