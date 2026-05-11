// =============================================================
// routes/studentRoutes.js — Student Module (MongoDB)
// =============================================================
const express         = require("express");
const mongoose        = require("mongoose");
const FormApplication = require("../models/FormApplication");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, authorizeRoles("student"));

// GET /api/student/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.id);

    const [counts, recent] = await Promise.all([
      FormApplication.aggregate([
        { $match: { user_id: uid } },
        { $group: {
          _id:              null,
          total:            { $sum: 1 },
          pending_admin:    { $sum: { $cond: [{ $eq: ["$status","pending_admin"] }, 1, 0] } },
          pending_pengarah: { $sum: { $cond: [{ $eq: ["$status","pending_pengarah"] }, 1, 0] } },
          fully_approved:   { $sum: { $cond: [{ $eq: ["$status","fully_approved"] }, 1, 0] } },
          rejected:         { $sum: { $cond: [{ $eq: ["$status","rejected"] }, 1, 0] } },
        }},
      ]),
      FormApplication.find({ user_id: uid })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return res.json({
      success: true,
      data: {
        stats: counts[0] || { total:0, pending_admin:0, pending_pengarah:0, fully_approved:0, rejected:0 },
        recent: recent.map(r => ({
          id:           r._id?.toString(),
          form_type:    r.form_type,
          status:       r.status,
          reason:       r.reason,
          submitted_at: r.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error("❌ student/dashboard:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/student/applications
router.get("/applications", async (req, res) => {
  try {
    const { form_type, status, page = 1, limit = 10 } = req.query;
    const filter = { user_id: req.user.id };
    if (form_type) filter.form_type = form_type;
    if (status)    filter.status    = status;

    const [total, applications] = await Promise.all([
      FormApplication.countDocuments(filter),
      FormApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .populate("admin_id",    "name")
        .populate("pengarah_id", "name")
        .lean(),
    ]);

    const mapped = applications.map(a => ({
      id:                  a._id?.toString(),
      form_type:           a.form_type,
      status:              a.status,
      reason:              a.reason,
      start_date:          a.start_date,
      end_date:            a.end_date,
      submitted_at:        a.createdAt,
      file_path:           a.file_path,
      admin_comment:       a.admin_comment,
      admin_approved_at:   a.admin_approved_at,
      pengarah_comment:    a.pengarah_comment,
      pengarah_approved_at:a.pengarah_approved_at,
      admin_name:          a.admin_id?.name,
      pengarah_name:       a.pengarah_id?.name,
      // Sick leave
      hospital_type:       a.sick_leave_data?.hospital_type,
      hospital_name:       a.sick_leave_data?.hospital_name,
      // Appeal
      course_code:         a.appeal_review_data?.course_code,
      course_name:         a.appeal_review_data?.course_name,
      grade:               a.appeal_review_data?.grade,
      receipt_no:          a.appeal_review_data?.receipt_no,
      amount_paid:         a.appeal_review_data?.amount_paid,
      semester:            a.appeal_review_data?.semester,
      appeal_session:      a.appeal_review_data?.session,
    }));

    return res.json({
      success: true,
      data: {
        applications: mapped,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    console.error("❌ student/applications:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/student/applications/:id
router.get("/applications/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid application ID." });
    }

    const a = await FormApplication.findOne({ _id: req.params.id, user_id: req.user.id })
      .populate("admin_id",    "name")
      .populate("pengarah_id", "name")
      .lean();

    if (!a) return res.status(404).json({ success: false, message: "Application not found." });

    return res.json({
      success: true,
      data: {
        id:                   a._id?.toString(),
        form_type:            a.form_type,
        status:               a.status,
        reason:               a.reason,
        start_date:           a.start_date,
        end_date:             a.end_date,
        submitted_at:         a.createdAt,
        file_path:            a.file_path,
        admin_comment:        a.admin_comment,
        admin_approved_at:    a.admin_approved_at,
        pengarah_comment:     a.pengarah_comment,
        pengarah_approved_at: a.pengarah_approved_at,
        admin_name:           a.admin_id?.name,
        pengarah_name:        a.pengarah_id?.name,
        hospital_type:        a.sick_leave_data?.hospital_type,
        hospital_name:        a.sick_leave_data?.hospital_name,
        mc_file_path:         a.sick_leave_data?.mc_file_path,
        course_code:          a.appeal_review_data?.course_code,
        course_name:          a.appeal_review_data?.course_name,
        grade:                a.appeal_review_data?.grade,
        receipt_no:           a.appeal_review_data?.receipt_no,
        amount_paid:          a.appeal_review_data?.amount_paid,
        semester:             a.appeal_review_data?.semester,
        appeal_session:       a.appeal_review_data?.session,
        appeal_lecturer:      a.appeal_review_data?.lecturer_name,
      },
    });
  } catch (err) {
    console.error("❌ student/applications/:id:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
