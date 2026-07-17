// =============================================================
// routes/pengarahRoutes.js — Pengarah Module (MongoDB version)
// =============================================================
const express         = require("express");
const path            = require("path");
const fs              = require("fs");
const FormApplication = require("../models/FormApplication");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, authorizeRoles("pengarah"));

// Helper — flatten a populated application doc for the frontend
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
  address:         a.user_id?.profile?.address,
  admin_name:      a.admin_id?.name,
  pengarah_name:   a.pengarah_id?.name,
  hospital_type:   a.sick_leave_data?.hospital_type,
  hospital_name:   a.sick_leave_data?.hospital_name,
  mc_file_path:    a.sick_leave_data?.mc_file_path,
  receipt_no:      a.appeal_review_data?.receipt_no,
  amount_paid:     a.appeal_review_data?.amount_paid,
  semester:        a.appeal_review_data?.semester,
  appeal_session:  a.appeal_review_data?.session,
  course_code:     a.appeal_review_data?.course_code,
  course_name:     a.appeal_review_data?.course_name,
  grade:           a.appeal_review_data?.grade,
  appeal_lecturer: a.appeal_review_data?.lecturer_name,
  submitted_at:    a.createdAt,
});

// =============================================================
// GET /api/pengarah/dashboard
// =============================================================
router.get("/dashboard", async (req, res) => {
  try {
    const [counts, pending, recentDecisions] = await Promise.all([
      FormApplication.aggregate([{ $group: {
        _id: null,
        total:            { $sum: 1 },
        pending_admin:    { $sum: { $cond: [{ $eq: ["$status","pending_admin"] }, 1, 0] } },
        pending_pengarah: { $sum: { $cond: [{ $eq: ["$status","pending_pengarah"] }, 1, 0] } },
        fully_approved:   { $sum: { $cond: [{ $eq: ["$status","fully_approved"] }, 1, 0] } },
        rejected:         { $sum: { $cond: [{ $eq: ["$status","rejected"] }, 1, 0] } },
      }}]),
      FormApplication.find({ status: "pending_pengarah" })
        .sort({ admin_approved_at: 1 }).limit(5)
        .populate("user_id",  "name matric_staff_id profile")
        .populate("admin_id", "name")
        .lean(),
      FormApplication.find({ pengarah_id: req.user.id })
        .sort({ pengarah_approved_at: -1 }).limit(5)
        .populate("user_id", "name matric_staff_id")
        .lean(),
    ]);

    return res.json({
      success: true,
      data: {
        stats: counts[0] || { total:0, pending_admin:0, pending_pengarah:0, fully_approved:0, rejected:0 },
        pending: pending.map(p => ({
          id:             p._id?.toString(),
          form_type:      p.form_type,
          status:         p.status,
          submitted_at:   p.createdAt,
          student_name:   p.user_id?.name,
          student_matric: p.user_id?.matric_staff_id,
          program:        p.user_id?.profile?.program,
          admin_name:     p.admin_id?.name,
          admin_approved_at: p.admin_approved_at,
        })),
        recentDecisions: recentDecisions.map(r => ({
          id:                   r._id?.toString(),
          form_type:            r.form_type,
          status:               r.status,
          student_name:         r.user_id?.name,
          student_matric:       r.user_id?.matric_staff_id,
          pengarah_comment:     r.pengarah_comment,
          pengarah_approved_at: r.pengarah_approved_at,
        })),
      },
    });
  } catch (err) {
    console.error("❌ pengarah/dashboard:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// =============================================================
// GET /api/pengarah/applications
// =============================================================
router.get("/applications", async (req, res) => {
  try {
    const { status, form_type, search, page = 1, limit = 15 } = req.query;
    const filter = { status: { $ne: "pending_admin" } };
    if (status)    filter.status    = status;
    if (form_type) filter.form_type = form_type;

    if (search) {
      const User = require("../models/User");
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { matric_staff_id: { $regex: search, $options: "i" } },
        ]
      }).select("_id");
      filter.user_id = { $in: users.map(u => u._id) };
    }

    const [total, apps] = await Promise.all([
      FormApplication.countDocuments(filter),
      FormApplication.find(filter)
        .sort({ status: 1, admin_approved_at: 1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .populate("user_id",  "name matric_staff_id profile")
        .populate("admin_id", "name")
        .lean(),
    ]);

    return res.json({
      success: true,
      data: {
        applications: apps.map(flattenApp),
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    console.error("❌ pengarah/applications:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// =============================================================
// GET /api/pengarah/applications/:id
// =============================================================
router.get("/applications/:id", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid application ID." });
    }

    const app = await FormApplication.findOne({
      _id: req.params.id, status: { $ne: "pending_admin" },
    })
      .populate("user_id",     "name matric_staff_id email phone ic_number profile")
      .populate("admin_id",    "name")
      .populate("pengarah_id", "name")
      .lean();

    if (!app) return res.status(404).json({ success: false, message: "Not found." });

    return res.json({ success: true, data: flattenApp(app) });
  } catch (err) {
    console.error("❌ pengarah/applications/:id:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// =============================================================
// PATCH /api/pengarah/applications/:id/approve
// =============================================================
router.patch("/applications/:id/approve", async (req, res) => {
  try {
    const { comment = "", signature_data } = req.body;
    const app = await FormApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: "Not found." });
    if (app.status !== "pending_pengarah") {
      return res.status(400).json({ success: false, message: `Cannot approve — status is "${app.status}".` });
    }

    let signaturePath = null;
    if (signature_data) {
      try {
        const base64 = signature_data.replace(/^data:image\/png;base64,/, "");
        const dir    = path.join(__dirname, "..", "uploads", "signatures");
        fs.mkdirSync(dir, { recursive: true });
        const filename = `sig_${app._id}_${Date.now()}.png`;
        fs.writeFileSync(path.join(dir, filename), Buffer.from(base64, "base64"));
        signaturePath = `/uploads/signatures/${filename}`;
      } catch (e) { console.warn("Signature save failed:", e.message); }
    }

    app.status               = "fully_approved";
    app.pengarah_id          = req.user.id;
    app.pengarah_comment     = comment;
    app.pengarah_approved_at = new Date();
    if (signaturePath) app.signature_path = signaturePath;
    await app.save();

    return res.json({ success: true, message: "Application fully approved.", signature_path: signaturePath });
  } catch (err) {
    console.error("❌ pengarah/approve:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// =============================================================
// PATCH /api/pengarah/applications/:id/reject
// =============================================================
router.patch("/applications/:id/reject", async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment?.trim()) return res.status(400).json({ success: false, message: "Rejection reason is required." });

    const app = await FormApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: "Not found." });
    if (app.status !== "pending_pengarah") {
      return res.status(400).json({ success: false, message: `Cannot reject — status is "${app.status}".` });
    }

    app.status               = "rejected";
    app.pengarah_id          = req.user.id;
    app.pengarah_comment     = comment.trim();
    app.pengarah_approved_at = new Date();
    await app.save();

    return res.json({ success: true, message: "Application rejected." });
  } catch (err) {
    console.error("❌ pengarah/reject:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// =============================================================
// GET /api/pengarah/analytics
// =============================================================
router.get("/analytics", async (req, res) => {
  try {
    const [byType, byStatus, monthly] = await Promise.all([
      FormApplication.aggregate([{ $group: { _id: "$form_type", count: { $sum: 1 } } }]),
      FormApplication.aggregate([{ $group: { _id: "$status",    count: { $sum: 1 } } }]),
      FormApplication.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
        { $group: {
          _id:      { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          total:    { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ["$status","fully_approved"] }, 1, 0] } },
        }},
        { $sort: { _id: 1 } },
      ]),
    ]);
    return res.json({ success: true, data: {
      byType:   byType.map(x  => ({ form_type: x._id, count: x.count })),
      byStatus: byStatus.map(x => ({ status: x._id,   count: x.count })),
      monthly:  monthly.map(x  => ({ month: x._id, total: x.total, approved: x.approved })),
    }});
  } catch (err) {
    console.error("❌ pengarah/analytics:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
