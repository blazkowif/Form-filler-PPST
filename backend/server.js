// =============================================================
// server.js — PPST E-Portal (MongoDB version)
// =============================================================
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config();

const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const morgan    = require("morgan");
const path      = require("path");
const rateLimit = require("express-rate-limit");

const connectDB       = require("./config/db");
const authRoutes      = require("./routes/authRoutes");
const studentRoutes   = require("./routes/studentRoutes");
const formRoutes      = require("./routes/formRoutes");
const adminRoutes     = require("./routes/adminRoutes");
const lecturerRoutes  = require("./routes/lecturerRoutes");
const pengarahRoutes  = require("./routes/pengarahRoutes");
const printRoutes     = require("./routes/printRoutes");
const pdfFillRoutes     = require("./routes/pdfFillRoutes");
const calibrateRoutes   = require("./routes/calibrateRoutes");

const app  = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (Replit / reverse-proxy environment)
app.set("trust proxy", 1);

// Security
app.use(helmet());
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5000";
// Allow the deployed frontend origin and local dev origin for convenience.
const ALLOWED_ORIGINS = [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests like curl/postman (origin is undefined)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  methods:        ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials:    true,
}));

// Rate limiting
app.use("/api/", rateLimit({ windowMs: 15*60*1000, max: 300 }));
app.use("/api/auth/login", rateLimit({
  windowMs: 15*60*1000, max: 20,
  message: { success: false, message: "Too many login attempts. Try again in 15 minutes." },
}));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// Static uploads — served from /uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth",     authRoutes);
app.use("/api/student",  studentRoutes);
app.use("/api/forms",    formRoutes);
app.use("/api/admin",    adminRoutes);
app.use("/api/lecturer", lecturerRoutes);
app.use("/api/pengarah", pengarahRoutes);
app.use("/api/print",   printRoutes);
app.use("/api/pdf",       pdfFillRoutes);
app.use("/api/calibrate", calibrateRoutes);

// Health check
app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "PPST E-Portal API running.", timestamp: new Date().toISOString() })
);

// 404
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.originalUrl}` })
);

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥", err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error.",
  });
});

// Start
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log("=".repeat(55));
    console.log(`🚀 PPST E-Portal Server | Port: ${PORT}`);
    console.log(`   Database: MongoDB Atlas`);
    console.log(`   Frontend: ${process.env.FRONTEND_URL}`);
    console.log("=".repeat(55));
  });
};

start();
module.exports = app;
