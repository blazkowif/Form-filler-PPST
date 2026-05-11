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
    const { reason, start_date, end_date, hospital_type, hospital_name } = req.body;

    if (!reason || !start_date || !hospital_type || !hospital_name) {
      return res.status(400).json({ success: false, message: "Missing required fields: reason, start_date, hospital_type, hospital_name." });
    }
    if (!["government","private"].includes(hospital_type)) {
      return res.status(400).json({ success: false, message: "Invalid hospital type." });
    }

    const app = await FormApplication.create({
      user_id:   req.user.id,
      form_type: "sick_leave",
      reason,
      start_date: new Date(start_date),
      end_date:   end_date ? new Date(end_date) : null,
      sick_leave_data: {
        hospital_type,
        hospital_name,
        mc_file_path: buildPath(req.file, "medical_certs"),
      },
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
    const { reason, start_date, end_date } = req.body;

    if (!reason || !start_date) {
      return res.status(400).json({ success: false, message: "Missing required fields: reason, start_date." });
    }

    const app = await FormApplication.create({
      user_id:    req.user.id,
      form_type:  "non_sick_leave",
      reason,
      start_date: new Date(start_date),
      end_date:   end_date ? new Date(end_date) : null,
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
      reason, semester, session, course_code, course_name,
      grade, lecturer_name, receipt_no, amount_paid,
    } = req.body;

    const required = { reason, semester, session, course_code, course_name, grade, lecturer_name, receipt_no, amount_paid };
    const missing  = Object.keys(required).filter(k => !req.body[k]);
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    const app = await FormApplication.create({
      user_id:   req.user.id,
      form_type: "appeal_review",
      reason,
      file_path: buildPath(req.file, "attachments"),
      appeal_review_data: {
        receipt_no,
        amount_paid:  parseFloat(amount_paid),
        semester:     parseInt(semester),
        session,
        course_code,
        course_name,
        grade,
        lecturer_name,
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
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Reason for withdrawal is required." });
    }

    const app = await FormApplication.create({
      user_id:   req.user.id,
      form_type: "withdrawal",
      reason:    reason.trim(),
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
    const { reason, start_date, end_date } = req.body;

    if (!reason || !start_date) {
      return res.status(400).json({ success: false, message: "Missing required fields: reason, start_date." });
    }

    const app = await FormApplication.create({
      user_id:    req.user.id,
      form_type:  "exam_replacement",
      reason:     reason.trim(),
      start_date: new Date(start_date),
      end_date:   end_date ? new Date(end_date) : null,
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
    const { reason, start_date, end_date } = req.body;

    if (!reason || !start_date) {
      return res.status(400).json({ success: false, message: "Missing required fields: reason (purpose), start_date (booking date)." });
    }

    const app = await FormApplication.create({
      user_id:    req.user.id,
      form_type:  "room_booking",
      reason:     reason.trim(),
      start_date: new Date(start_date),
      end_date:   end_date ? new Date(end_date) : null,
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
