// =============================================================
// routes/calibrateRoutes.js
// Admin-only endpoints to download PDF calibration grids.
// GET /api/calibrate/zip        → all 6 grids as a single .zip
// GET /api/calibrate/:formKey   → single calibration PDF
// GET /api/calibrate            → JSON list of available files
// =============================================================
const express  = require("express");
const path     = require("path");
const fs       = require("fs");
const archiver = require("archiver");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, authorizeRoles("admin", "pengarah"));

const FORMS_DIR = path.join(__dirname, "..", "assets", "forms");

const FORM_KEYS = ["AKD-01", "AKD-02", "AKD-03", "AKD-04", "AKD-05", "AKD-06"];

const FORM_LABELS = {
  "AKD-01": "Permohonan Berhenti Pengajian (Withdrawal)",
  "AKD-02": "Peperiksaan Gantian/Ulangan (Exam Replacement)",
  "AKD-03": "Rayuan Semakan Semula Keputusan (Result Review)",
  "AKD-04": "Tunjuk Sebab Tidak Hadir (Absence Justification)",
  "AKD-05": "Tempahan Bilik Kuliah/Tutorial (Room Booking)",
  "AKD-06": "Permohonan Cuti Sakit (Sick Leave)",
};

// GET /api/calibrate — list available files
router.get("/", (req, res) => {
  const files = FORM_KEYS.map((key) => {
    const calibPath   = path.join(FORMS_DIR, `${key}_calibrate.pdf`);
    const templatePath= path.join(FORMS_DIR, `${key}.pdf`);
    return {
      key,
      label:             FORM_LABELS[key],
      calibrate_ready:   fs.existsSync(calibPath),
      template_ready:    fs.existsSync(templatePath),
      calibrate_size_kb: fs.existsSync(calibPath)
        ? Math.round(fs.statSync(calibPath).size / 1024)
        : null,
    };
  });
  res.json({ success: true, data: files });
});

// GET /api/calibrate/zip — stream all calibration PDFs as a zip
router.get("/zip", (req, res) => {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="PPST_Calibration_Grids.zip"`);

  const archive = archiver("zip", { zlib: { level: 6 } });
  archive.on("error", (err) => {
    console.error("Zip error:", err);
    if (!res.headersSent) res.status(500).end();
  });
  archive.pipe(res);

  let found = 0;
  FORM_KEYS.forEach((key) => {
    const calibPath = path.join(FORMS_DIR, `${key}_calibrate.pdf`);
    if (fs.existsSync(calibPath)) {
      archive.file(calibPath, { name: `${key}_calibrate.pdf` });
      found++;
    }
  });

  if (found === 0) {
    archive.abort();
    return res.status(404).json({
      success: false,
      message: "No calibration files found. Run: python3 pdf_filler.py --calibrate AKD-01",
    });
  }

  archive.finalize();
});

// GET /api/calibrate/:formKey — single calibration PDF
router.get("/:formKey", (req, res) => {
  const key  = req.params.formKey.toUpperCase();
  if (!FORM_KEYS.includes(key)) {
    return res.status(400).json({ success: false, message: `Unknown form key: ${key}` });
  }
  const calibPath = path.join(FORMS_DIR, `${key}_calibrate.pdf`);
  if (!fs.existsSync(calibPath)) {
    return res.status(404).json({
      success: false,
      message: `Calibration grid not found for ${key}. Generate it with: python3 pdf_filler.py --calibrate ${key}`,
    });
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${key}_calibrate.pdf"`);
  res.sendFile(calibPath);
});

module.exports = router;
