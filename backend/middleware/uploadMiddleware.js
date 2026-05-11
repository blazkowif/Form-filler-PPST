// =============================================================
// middleware/uploadMiddleware.js — Multer File Upload Config
// =============================================================
// Provides two pre-configured Multer upload handlers:
//   `uploadSingle`  — one file field named "file"
//   `uploadMC`      — one file field named "mc_file" (sick leave MC)
//
// Files are stored in /uploads/<subfolder>/ with a timestamped
// filename to avoid collisions.
// =============================================================

const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");

// Allowed MIME types for student uploads
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10);

/**
 * Build a Multer DiskStorage engine for a given subfolder.
 * Files are saved as: uploads/<subfolder>/<timestamp>-<original>.ext
 */
const buildStorage = (subfolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(
        __dirname,
        "..",
        process.env.UPLOAD_DIR || "uploads",
        subfolder
      );
      // Create the directory if it doesn't exist yet
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      // Sanitise the original filename and prepend a timestamp
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}-${safe}`);
    },
  });

/**
 * Shared file filter — rejects any MIME type not in ALLOWED_TYPES.
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: "${file.mimetype}". Only PDF, JPG, and PNG files are allowed.`
      ),
      false
    );
  }
};

// --- General attachment upload (field: "file") ---
const uploadSingle = multer({
  storage: buildStorage("attachments"),
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
}).single("file");

// --- Medical Certificate upload for Sick Leave (field: "mc_file") ---
const uploadMC = multer({
  storage: buildStorage("medical_certs"),
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
}).single("mc_file");

/**
 * Express-friendly wrappers that forward Multer errors into
 * the global error handler via next(err).
 */
const wrapUpload = (multerFn) => (req, res, next) => {
  multerFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: `File is too large. Maximum allowed size is ${MAX_SIZE_MB} MB.`,
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

module.exports = {
  uploadSingle: wrapUpload(uploadSingle),
  uploadMC:     wrapUpload(uploadMC),
};
