// =============================================================
// routes/formRoutes.js — All 6 Form Submissions (MongoDB)
// =============================================================
const express         = require("express");
const mongoose        = require("mongoose");
const FormApplication = require("../models/FormApplication");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { uploadSingle, uploadMC }  = require("../middleware/uploadMiddleware");

const router = express.Router();
router.use(protect, authorizeRoles("student"));

const buildPath = (file, sub) =>
  file ? `/uploads/${sub}/${file.filename}` : null;

// ── 1. Sick Leave (PPST/AKD-06) ──────────────────────────────
router.post("/submit/sick_leave", uploadMC, async (req, res) => {
  try {
    const { class_group, hospital_type } = req.body;

    if (!class_group || !hospital_type) {
      return res.status(400).json({ success: false, message: "Missing required fields: class_group, hospital_type." });
    }
    if (!["government","private"].includes(hospital_type)) {
      return res.status(400).json({ success: false, message: "Invalid hospital type." });
    }

    const app = await FormApplication.create({
      user_id:   req.user.id,
      form_type: "sick_leave",
      reason: "",
      sick_leave_data: {
        hospital_type,
        mc_file_path: buildPath(req.file, "medical_certs"),
      },
      class_group,
    });

    return res.status(201).json({
      success: true,
      message: "Sick Leave application submitted successfully.",
      data: { application_id: app._id.toString() },
    });
  } catch (err) {
    console.error("❌ submit/sick_leave:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── 2. Non-Sick Leave (PPST/AKD-07) ──────────────────────────
router.post("/submit/non_sick_leave", uploadSingle, async (req, res) => {
  try {
    const { reason_text, date_of_absence, course_row_1_code, course_row_1_name } = req.body;

    if (!reason_text || !date_of_absence || !course_row_1_code || !course_row_1_name) {
      return res.status(400).json({ success: false, message: "Missing required fields: reason_text, date_of_absence, course_row_1_code, course_row_1_name." });
    }

    const app = await FormApplication.create({
      user_id:    req.user.id,
      form_type:  "non_sick_leave",
      reason: reason_text,
      start_date: new Date(date_of_absence),
      course_code: course_row_1_code,
      course_name: course_row_1_name,
      file_path:  buildPath(req.file, "attachments"),
    });

    return res.status(201).json({
      success: true,
      message: "Non-Sick Leave application submitted successfully.",
      data: { application_id: app._id.toString() },
    });
  } catch (err) {
    console.error("❌ submit/non_sick_leave:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── 3. Appeal for Exam Review (PPST/AKD-03) ──────────────────
router.post("/submit/appeal_review", uploadSingle, async (req, res) => {
  try {
    const {
      semester, session, course_row_1_code, course_row_1_name,
      course_row_1_grade, course_row_1_lecturer, course_row_1_offering_centre,
      receipt_no, receipt_date, amount_paid,
    } = req.body;

    const required = { semester, session, course_row_1_code, course_row_1_name, course_row_1_grade, course_row_1_lecturer, course_row_1_offering_centre, receipt_no, receipt_date, amount_paid };
    const missing  = Object.keys(required).filter(k => !req.body[k]);
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    const app = await FormApplication.create({
      user_id:   req.user.id,
      form_type: "appeal_review",
      reason: "",
      file_path: buildPath(req.file, "attachments"),
      appeal_review_data: {
        receipt_no,
        receipt_date,
        amount_paid:  parseFloat(amount_paid),
        semester:     parseInt(semester),
        session,
        course_code: course_row_1_code,
        course_name: course_row_1_name,
        grade: course_row_1_grade,
        lecturer_name: course_row_1_lecturer,
        faculty: course_row_1_offering_centre,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Appeal for Exam Review submitted successfully.",
      data: { application_id: app._id.toString() },
    });
  } catch (err) {
    console.error("❌ submit/appeal_review:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── 4. Withdrawal from Studies (PPST/AKD-01) ─────────────────
router.post("/submit/withdrawal", uploadSingle, async (req, res) => {
  try {
    const {
      withdrawal_reason,
      institution_name,
      confirm_hostel_key,
      confirm_fees,
      confirm_ppst_items,
      confirm_library_books,
    } = req.body;

    if (!withdrawal_reason) {
      return res.status(400).json({ success: false, message: "Withdrawal reason is required." });
    }

    const resolvedReason = withdrawal_reason || "personal";

    const app = await FormApplication.create({
      user_id:   req.user.id,
      form_type: "withdrawal",
      reason:    "",
      withdrawal_reason: resolvedReason,
      institution_name: institution_name?.trim() || "",
      withdrawal_data: {
        confirm_hostel_key: confirm_hostel_key === "true" || confirm_hostel_key === true,
        confirm_fees: confirm_fees === "true" || confirm_fees === true,
        confirm_ppst_items: confirm_ppst_items === "true" || confirm_ppst_items === true,
        confirm_library_books: confirm_library_books === "true" || confirm_library_books === true,
      },
      file_path: buildPath(req.file, "attachments"),
    });

    return res.status(201).json({
      success: true,
      message: "Withdrawal application submitted. The Admin will review your request.",
      data: { application_id: app._id.toString() },
    });
  } catch (err) {
    console.error("❌ submit/withdrawal:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── 5. Replacement / Repeat Exam (PPST/AKD-02) ───────────────
router.post("/submit/exam_replacement", uploadSingle, async (req, res) => {
  try {
    const { semester, session, exam_reason, course_row_1_code, course_row_1_name, course_row_1_exam_dt } = req.body;

    if (!semester || !session || !exam_reason || !course_row_1_code || !course_row_1_name || !course_row_1_exam_dt) {
      return res.status(400).json({ success: false, message: "Missing required exam replacement fields." });
    }

    const app = await FormApplication.create({
      user_id:    req.user.id,
      form_type:  "exam_replacement",
      reason:     "",
      exam_reason,
      exam_date: new Date(course_row_1_exam_dt),
      course_code: course_row_1_code,
      course_name: course_row_1_name,
      semester,
      session,
      file_path:  buildPath(req.file, "attachments"),
    });

    return res.status(201).json({
      success: true,
      message: "Replacement / Repeat Exam application submitted successfully.",
      data: { application_id: app._id.toString() },
    });
  } catch (err) {
    console.error("❌ submit/exam_replacement:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── 6. Room Booking (PPST/AKD-05) ────────────────────────────
router.post("/submit/room_booking", async (req, res) => {
  try {
    const { purpose, booking_date, room_choice, Others_rooms } = req.body;

    if (!purpose || !booking_date || !room_choice) {
      return res.status(400).json({ success: false, message: "Missing required fields: purpose, booking_date, room_choice." });
    }

    const app = await FormApplication.create({
      user_id:           req.user.id,
      form_type:         "room_booking",
      reason:            purpose.trim(),
      room_choice,
      applicant_position: "Pelajar",
      start_date:        new Date(booking_date),
      room_booking_data: {
        room_type: "",
        other_room: Others_rooms || "",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Room Booking request submitted successfully.",
      data: { application_id: app._id.toString() },
    });
  } catch (err) {
    console.error("❌ submit/room_booking:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── Withdraw a pending application ───────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid application ID." });
    }

    const app = await FormApplication.findOneAndDelete({
      _id:     req.params.id,
      user_id: req.user.id,
      status:  "pending_admin",
    });

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "Application not found, already reviewed, or access denied.",
      });
    }

    return res.json({ success: true, message: "Application withdrawn successfully." });
  } catch (err) {
    console.error("❌ delete form:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
