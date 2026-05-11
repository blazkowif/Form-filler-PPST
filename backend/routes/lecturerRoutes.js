// =============================================================
// routes/lecturerRoutes.js — Lecturer Module (MongoDB version)
// =============================================================
const express         = require("express");
const User            = require("../models/User");
const FormApplication = require("../models/FormApplication");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, authorizeRoles("lecturer"));

// GET /api/lecturer/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const leaveTypes = ["sick_leave", "non_sick_leave"];

    const [totalStudents, stats, recentLeave] = await Promise.all([
      User.countDocuments({ role: "student" }),
      FormApplication.aggregate([
        { $match: { form_type: { $in: leaveTypes } } },
        { $group: {
          _id: null,
          pending_leave:    { $sum: { $cond: [{ $eq: ["$status","pending_admin"] }, 1, 0] } },
          approved_absences:{ $sum: { $cond: [{ $eq: ["$status","fully_approved"] }, 1, 0] } },
          sick_leave_count: { $sum: { $cond: [{ $and: [{ $eq: ["$form_type","sick_leave"] }, { $eq: ["$status","fully_approved"] }] }, 1, 0] } },
          non_sick_count:   { $sum: { $cond: [{ $and: [{ $eq: ["$form_type","non_sick_leave"] }, { $eq: ["$status","fully_approved"] }] }, 1, 0] } },
        }}
      ]),
      FormApplication.find({ form_type: { $in: leaveTypes } })
        .sort({ createdAt: -1 }).limit(5)
        .populate("user_id", "name matric_staff_id profile")
        .lean(),
    ]);

    // Per-group leave counts
    const perGroupRaw = await FormApplication.aggregate([
      { $match: { form_type: { $in: leaveTypes }, status: "fully_approved" } },
      { $lookup: { from: "users", localField: "user_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $group: { _id: "$user.profile.lecture_group", leave_count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
      { $sort: { leave_count: -1 } },
    ]);

    return res.json({
      success: true,
      data: {
        stats: { total_students: totalStudents, ...(stats[0] || {}) },
        recentLeave: recentLeave.map(r => ({
          ...r,
          student_name:    r.user_id?.name,
          student_matric:  r.user_id?.matric_staff_id,
          lecture_group:   r.user_id?.profile?.lecture_group,
          tutorial_group:  r.user_id?.profile?.tutorial_group,
          program:         r.user_id?.profile?.program,
        })),
        perGroup: perGroupRaw.map(g => ({ grp: g._id, leave_count: g.leave_count })),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/lecturer/roster
router.get("/roster", async (req, res) => {
  try {
    const { lecture_group, tutorial_group, search } = req.query;
    const filter = { role: "student" };
    if (lecture_group)  filter["profile.lecture_group"]  = lecture_group;
    if (tutorial_group) filter["profile.tutorial_group"] = tutorial_group;
    if (search) filter.$or = [
      { name:            { $regex: search, $options: "i" } },
      { matric_staff_id: { $regex: search, $options: "i" } },
    ];

    const students = await User.find(filter).select("-password").lean();

    // Get absence counts per student
    const ids = students.map(s => s._id);
    const absenceCounts = await FormApplication.aggregate([
      { $match: { user_id: { $in: ids }, form_type: { $in: ["sick_leave","non_sick_leave"] }, status: "fully_approved" } },
      { $group: {
        _id:              "$user_id",
        sick_leave_count: { $sum: { $cond: [{ $eq: ["$form_type","sick_leave"] }, 1, 0] } },
        non_sick_count:   { $sum: { $cond: [{ $eq: ["$form_type","non_sick_leave"] }, 1, 0] } },
        total_absences:   { $sum: 1 },
      }},
    ]);

    const countMap = {};
    absenceCounts.forEach(c => { countMap[c._id.toString()] = c; });

    const result = students.map(s => ({
      ...s,
      sick_leave_count: countMap[s._id.toString()]?.sick_leave_count || 0,
      non_sick_count:   countMap[s._id.toString()]?.non_sick_count   || 0,
      total_absences:   countMap[s._id.toString()]?.total_absences   || 0,
    }));

    return res.json({ success: true, data: { students: result, total: result.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/lecturer/attendance
router.get("/attendance", async (req, res) => {
  try {
    const { form_type, status, lecture_group, student_id, page = 1, limit = 20 } = req.query;
    const filter = { form_type: { $in: ["sick_leave","non_sick_leave"] } };
    if (form_type)  filter.form_type = form_type;
    if (status)     filter.status    = status;
    if (student_id) filter.user_id   = student_id;

    if (lecture_group) {
      const groupUsers = await User.find({ "profile.lecture_group": lecture_group }).select("_id");
      filter.user_id = { $in: groupUsers.map(u => u._id) };
    }

    const [total, records] = await Promise.all([
      FormApplication.countDocuments(filter),
      FormApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .populate("user_id", "name matric_staff_id profile")
        .lean(),
    ]);

    const mapped = records.map(r => ({
      ...r,
      student_name:    r.user_id?.name,
      student_matric:  r.user_id?.matric_staff_id,
      lecture_group:   r.user_id?.profile?.lecture_group,
      tutorial_group:  r.user_id?.profile?.tutorial_group,
      program:         r.user_id?.profile?.program,
      hospital_type:   r.sick_leave_data?.hospital_type,
      hospital_name:   r.sick_leave_data?.hospital_name,
    }));

    return res.json({
      success: true,
      data: { records: mapped, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/lecturer/stats
router.get("/stats", async (req, res) => {
  try {
    const byGroup = await FormApplication.aggregate([
      { $match: { form_type: { $in: ["sick_leave","non_sick_leave"] }, status: "fully_approved" } },
      { $lookup: { from: "users", localField: "user_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $group: {
        _id:      "$user.profile.lecture_group",
        total:    { $sum: 1 },
        sick:     { $sum: { $cond: [{ $eq: ["$form_type","sick_leave"] }, 1, 0] } },
        non_sick: { $sum: { $cond: [{ $eq: ["$form_type","non_sick_leave"] }, 1, 0] } },
      }},
      { $match: { _id: { $ne: null } } },
      { $sort: { _id: 1 } },
    ]);

    return res.json({ success: true, data: {
      byGroup: byGroup.map(g => ({ grp: g._id, total: g.total, sick: g.sick, non_sick: g.non_sick })),
    }});
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
