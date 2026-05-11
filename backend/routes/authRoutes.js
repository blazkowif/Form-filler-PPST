// =============================================================
// routes/authRoutes.js — Authentication (MongoDB version)
// =============================================================
const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { matric_staff_id, password } = req.body;
    if (!matric_staff_id || !password) {
      return res.status(400).json({ success: false, message: "Matric/Staff ID and password are required." });
    }

    const user = await User.findOne({ matric_staff_id: matric_staff_id.trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid Matric/Staff ID or password." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid Matric/Staff ID or password." });
    }

    const token = jwt.sign(
      { id: user._id, matric_staff_id: user.matric_staff_id, name: user.name, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
