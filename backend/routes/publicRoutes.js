const express = require("express");
const FormApplication = require("../models/FormApplication");

const router = express.Router();

const FORM_LABELS = {
  withdrawal: "Withdrawal from Studies (AKD-01)",
  exam_replacement: "Replacement / Repeat Exam (AKD-02)",
  appeal_review: "Appeal for Exam Review (AKD-03)",
  non_sick_leave: "Absence Justification (AKD-04)",
  room_booking: "Room Booking (AKD-05)",
  sick_leave: "Sick Leave (AKD-06)",
};

const stagesFor = (app) => [
  {
    key: "submitted",
    label: "Submitted",
    state: "complete",
    date: app.createdAt,
  },
  {
    key: "admin",
    label: app.status === "rejected" && !app.pengarah_approved_at ? "Admin Review — Rejected" : "Admin Review",
    state: app.admin_approved_at || (app.status === "rejected" && app.admin_id) ? "complete" : "current",
    date: app.admin_approved_at,
  },
  {
    key: "pengarah",
    label: app.status === "rejected" && app.pengarah_approved_at ? "Pengarah Review — Rejected" : "Pengarah Approval",
    state: app.pengarah_approved_at ? "complete" : app.status === "pending_pengarah" ? "current" : "upcoming",
    date: app.pengarah_approved_at,
  },
  {
    key: "complete",
    label: "Completed",
    state: app.status === "fully_approved" ? "complete" : "upcoming",
    date: app.status === "fully_approved" ? app.pengarah_approved_at : null,
  },
];

router.get("/status/:reference", async (req, res) => {
  try {
    const reference = decodeURIComponent(req.params.reference).trim().toUpperCase();
    const app = await FormApplication.findOne({ reference_no: reference })
      .select("reference_no form_type status createdAt admin_approved_at pengarah_approved_at admin_id pengarah_id")
      .lean();

    if (!app) return res.status(404).json({ success: false, message: "Reference number not found." });

    return res.json({
      success: true,
      data: {
        reference_no: app.reference_no,
        form_type: app.form_type,
        form_label: FORM_LABELS[app.form_type] || app.form_type,
        status: app.status,
        stages: stagesFor(app),
      },
    });
  } catch (err) {
    console.error("❌ public/status:", err);
    return res.status(400).json({ success: false, message: "Invalid reference number." });
  }
});

module.exports = router;
