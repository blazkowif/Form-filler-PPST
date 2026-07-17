// =============================================================
// routes/pdfFillRoutes.js
// Calls backend/pdf_filler.py (ReportLab + pypdf) to overlay
// student data onto the original AKD-XX.pdf template and
// stream the filled PDF back to the browser.
// =============================================================
const express         = require("express");
const path            = require("path");
const { spawn }       = require("child_process");
const FormApplication = require("../models/FormApplication");
const { protect }     = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);

const SCRIPT = path.join(__dirname, "..", "pdf_filler.py");

// ─────────────────────────────────────────────────────────────
// Helper — build a flat JSON payload for the Python script
// ─────────────────────────────────────────────────────────────
const buildPayload = (app, user) => {
  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

  return {
    // ── Common student profile ────────────────────────────────
    student_name:  user?.name             || "",
    student_no:    user?.matric_staff_id  || "",
    matric_no:     user?.matric_staff_id  || "",
    programme:     user?.profile?.program || "",
    phone_no:      user?.phone            || user?.profile?.phone || "",
    ic_number:     user?.ic_number        || "",
    centre:        "PPST",
    faculty:       user?.profile?.faculty || "PPST",
    address:       user?.profile?.address || "",
    student_date:  fmt(app.createdAt),

    // ── AKD-01 Withdrawal ────────────────────────────────────
    withdrawal_reason: app.withdrawal_reason || "",
    institution_name:  app.institution_name  || "",

    // ── AKD-02 Exam Replacement ──────────────────────────────
    semester:          app.appeal_review_data?.semester || app.semester || "",
    session:           app.appeal_review_data?.session  || "",
    exam_reason:       app.exam_reason || "",
    course_row_1_no:   "1",
    course_row_1_code: app.appeal_review_data?.course_code || app.course_code || "",
    course_row_1_name: app.appeal_review_data?.course_name || app.course_name || "",
    course_row_1_exam_dt: fmt(app.exam_date),

    // ── AKD-03 Result Review ─────────────────────────────────
    receipt_no:          app.appeal_review_data?.receipt_no    || "",
    receipt_date:        fmt(app.appeal_review_data?.payment_date),
    amount_paid:         app.appeal_review_data?.amount_paid
                           ? `RM ${Number(app.appeal_review_data.amount_paid).toFixed(2)}`
                           : "",
    course_row_1_grade:           app.appeal_review_data?.grade         || "",
    course_row_1_lecturer:        app.appeal_review_data?.lecturer_name || "",
    course_row_1_offering_centre: app.appeal_review_data?.faculty       || "PPST",

    // ── AKD-04 Absence Justification ─────────────────────────
    reason_text:              app.reason    || "",
    date_of_absence:          fmt(app.start_date),
    course_row_1_class_type:  app.class_type || "",

    // ── AKD-05 Room Booking ───────────────────────────────────
    applicant_name: user?.name || "",
    position:       app.applicant_position || "Pelajar",
    room_choice:    app.room_choice  || "",
    purpose:        app.reason       || "",
    booking_date:   fmt(app.start_date),

    // ── AKD-06 Sick Leave ─────────────────────────────────────
    class_group:   app.class_type    || "",
    hospital_type: app.sick_leave_data?.hospital_type || "",

    // ── Official use (filled post-decision) ───────────────────
    approval_status:    app.status           || "",
    director_comments:  app.pengarah_comment || app.admin_comment || "",
    director_date:      fmt(app.pengarah_approved_at || app.admin_approved_at),
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

    const payload  = buildPayload(app, app.user_id);
    const jsonData = JSON.stringify(payload);

    // Determine form_type key for the Python script
    const formType = app.form_type;
    const filename  = `PPST_${formType}_${app.user_id?.matric_staff_id || "form"}.pdf`;

    // Spawn Python filler
    const py = spawn("python3", [SCRIPT, formType]);

    // Send JSON data to Python via stdin
    py.stdin.write(jsonData);
    py.stdin.end();

    // Collect stderr for error reporting
    let stderr = "";
    py.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    // Stream stdout (PDF bytes) to response
    const chunks = [];
    py.stdout.on("data", (chunk) => chunks.push(chunk));

    py.on("close", (code) => {
      if (code !== 0) {
        console.error("❌ pdf_filler.py exited", code, ":", stderr);

        // Exit code 2 = template PDF missing
        if (code === 2) {
          return res.status(404).json({
            success: false,
            message: "PDF template not found in backend/assets/forms/. Please upload the original form PDFs.",
          });
        }
        return res.status(500).json({
          success: false,
          message: "PDF generation failed.",
          detail: stderr.slice(-400),
        });
      }

      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.end(pdfBuffer);
    });

    py.on("error", (err) => {
      console.error("❌ Failed to start python3:", err.message);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Could not start PDF generator. Make sure Python 3 is installed.",
        });
      }
    });

  } catch (err) {
    console.error("❌ pdfFillRoute:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
});

module.exports = router;
