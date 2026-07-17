// =============================================================
// routes/adminRoutes.js — Admin Module (MongoDB)
// =============================================================
const express         = require("express");
const mongoose        = require("mongoose");
const FormApplication = require("../models/FormApplication");
const User            = require("../models/User");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, authorizeRoles("admin"));

// Helper — flatten populated application for frontend
const flattenApp = (a) => ({
  ...a,
  id:              a._id?.toString(),
  student_name:    a.user_id?.name,
  student_matric:  a.user_id?.matric_staff_id,
  student_email:   a.user_id?.email,
  student_phone:   a.user_id?.phone,
  student_ic:      a.user_id?.ic_number,
  program:         a.user_id?.profile?.program,
  lecture_group:   a.user_id?.profile?.lecture_group,
  tutorial_group:  a.user_id?.profile?.tutorial_group,
  practical_group: a.user_id?.profile?.practical_group,
  address:         a.user_id?.profile?.address,
  admin_name:      a.admin_id?.name,
  pengarah_name:   a.pengarah_id?.name,
  // Sick leave
  hospital_type:   a.sick_leave_data?.hospital_type,
  hospital_name:   a.sick_leave_data?.hospital_name,
  mc_file_path:    a.sick_leave_data?.mc_file_path,
  // Appeal review
  receipt_no:      a.appeal_review_data?.receipt_no,
  amount_paid:     a.appeal_review_data?.amount_paid,
  semester:        a.appeal_review_data?.semester,
  appeal_session:  a.appeal_review_data?.session,
  course_code:     a.appeal_review_data?.course_code,
  course_name:     a.appeal_review_data?.course_name,
  grade:           a.appeal_review_data?.grade,
  appeal_lecturer: a.appeal_review_data?.lecturer_name,
});

// =============================================================
// GET /api/admin/dashboard
// =============================================================
router.get("/dashboard", async (req, res) => {
  try {
    const [counts, byType, recent] = await Promise.all([
      FormApplication.aggregate([
        { $group: {
          _id:              null,
          total:            { $sum: 1 },
          pending_admin:    { $sum: { $cond: [{ $eq: ["$status","pending_admin"] }, 1, 0] } },
          pending_pengarah: { $sum: { $cond: [{ $eq: ["$status","pending_pengarah"] }, 1, 0] } },
          fully_approved:   { $sum: { $cond: [{ $eq: ["$status","fully_approved"] }, 1, 0] } },
          rejected:         { $sum: { $cond: [{ $eq: ["$status","rejected"] }, 1, 0] } },
        }},
      ]),
      FormApplication.aggregate([
        { $group: { _id: "$form_type", count: { $sum: 1 } } },
        { $project: { form_type: "$_id", count: 1, _id: 0 } },
      ]),
      FormApplication.find({ status: "pending_admin" })
        .sort({ createdAt: 1 }).limit(5)
        .populate("user_id", "name matric_staff_id profile")
        .lean(),
    ]);

    return res.json({
      success: true,
      data: {
        stats:   counts[0] || { total:0, pending_admin:0, pending_pengarah:0, fully_approved:0, rejected:0 },
        by_type: byType,
        recent:  recent.map(r => ({
          id:             r._id?.toString(),
          form_type:      r.form_type,
          status:         r.status,
          submitted_at:   r.createdAt,
          reason:         r.reason,
          student_name:   r.user_id?.name,
          student_matric: r.user_id?.matric_staff_id,
          program:        r.user_id?.profile?.program,
        })),
      },
    });
  } catch (err) {
    console.error("❌ admin/dashboard:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================================
// GET /api/admin/applications
// =============================================================
router.get("/applications", async (req, res) => {
  try {
    const { form_type, status, search, page = 1, limit = 15 } = req.query;
    const filter = {};
    if (form_type) filter.form_type = form_type;
    if (status)    filter.status    = status;

    // If searching, first find matching user IDs
    if (search) {
      const users = await User.find({
        $or: [
          { name:            { $regex: search, $options: "i" } },
          { matric_staff_id: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      filter.user_id = { $in: users.map(u => u._id) };
    }

    const [total, applications] = await Promise.all([
      FormApplication.countDocuments(filter),
      FormApplication.find(filter)
        .sort({ status: 1, createdAt: 1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .populate("user_id",  "name matric_staff_id email phone profile")
        .populate("admin_id", "name")
        .lean(),
    ]);

    return res.json({
      success: true,
      data: {
        applications: applications.map(flattenApp),
        pagination: {
          total,
          page:  parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    console.error("❌ admin/applications:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================================
// GET /api/admin/applications/:id
// =============================================================
router.get("/applications/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid application ID." });
    }

    const app = await FormApplication.findById(req.params.id)
      .populate("user_id",     "name matric_staff_id email phone ic_number profile")
      .populate("admin_id",    "name")
      .populate("pengarah_id", "name")
      .lean();

    if (!app) return res.status(404).json({ success: false, message: "Application not found." });

    return res.json({ success: true, data: flattenApp(app) });
  } catch (err) {
    console.error("❌ admin/applications/:id:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================================
// PATCH /api/admin/applications/:id/approve
// =============================================================
router.patch("/applications/:id/approve", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid application ID." });
    }

    const { comment = "" } = req.body;
    const app = await FormApplication.findById(req.params.id);

    if (!app) return res.status(404).json({ success: false, message: "Application not found." });
    if (app.status !== "pending_admin") {
      return res.status(400).json({ success: false, message: `Cannot approve — current status is "${app.status}".` });
    }

    app.status            = "pending_pengarah";
    app.admin_id          = req.user.id;
    app.admin_comment     = comment;
    app.admin_approved_at = new Date();
    await app.save();

    return res.json({ success: true, message: "Application approved and forwarded to Pengarah." });
  } catch (err) {
    console.error("❌ admin/approve:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================================
// PATCH /api/admin/applications/:id/reject
// =============================================================
router.patch("/applications/:id/reject", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid application ID." });
    }

    const { comment } = req.body;
    if (!comment?.trim()) {
      return res.status(400).json({ success: false, message: "A rejection reason is required." });
    }

    const app = await FormApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: "Application not found." });
    if (app.status !== "pending_admin") {
      return res.status(400).json({ success: false, message: `Cannot reject — current status is "${app.status}".` });
    }

    app.status            = "rejected";
    app.admin_id          = req.user.id;
    app.admin_comment     = comment.trim();
    app.admin_approved_at = new Date();
    await app.save();

    return res.json({ success: true, message: "Application rejected." });
  } catch (err) {
    console.error("❌ admin/reject:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================================
// GET /api/admin/analytics
// =============================================================
router.get("/analytics", async (req, res) => {
  try {
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const [byType, byStatus, monthly] = await Promise.all([
      FormApplication.aggregate([
        { $group: { _id: "$form_type", count: { $sum: 1 } } },
        { $project: { form_type: "$_id", count: 1, _id: 0 } },
      ]),
      FormApplication.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ]),
      FormApplication.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: {
          _id:   { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
        { $project: { month: "$_id", count: 1, _id: 0 } },
      ]),
    ]);

    return res.json({ success: true, data: { byType, byStatus, monthly } });
  } catch (err) {
    console.error("❌ admin/analytics:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
