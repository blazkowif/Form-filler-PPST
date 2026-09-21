const express = require("express");
const fs = require("fs");
const path = require("path");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, authorizeRoles("student", "admin", "lecturer", "pengarah"));

const SCHEDULE_PATH = path.join(__dirname, "..", "assets", "forms", "Jadual.js");

router.get("/", (req, res) => {
  try {
    const schedule = JSON.parse(fs.readFileSync(SCHEDULE_PATH, "utf8"));
    return res.json({ success: true, data: schedule });
  } catch (err) {
    console.error("schedule/read:", err);
    return res.status(500).json({ success: false, message: "Could not load the class schedule." });
  }
});

module.exports = router;
