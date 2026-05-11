// =============================================================
// routes/printRoutes.js — Generate printable HTML form view
// GET /api/print/:id  — Returns populated HTML matching the
//                       official PPST form layout for printing
// =============================================================
const express         = require("express");
const mongoose        = require("mongoose");
const FormApplication = require("../models/FormApplication");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, authorizeRoles("admin", "pengarah"));

const fmt = (date) => date
  ? new Date(date).toLocaleDateString("en-MY", { day:"2-digit", month:"long", year:"numeric" })
  : "—";

const FORM_TITLES = {
  sick_leave:       "BORANG PERMOHONAN CUTI SAKIT / SICK LEAVE APPLICATION FORM (PPST/AKD-06)",
  non_sick_leave:   "BORANG TUNJUK SEBAB TIDAK HADIR / ABSENCE JUSTIFICATION FORM (PPST/AKD-07)",
  appeal_review:    "RAYUAN SEMAKAN SEMULA KEPUTUSAN PEPERIKSAAN / APPEAL FOR REVIEW OF EXAMINATION RESULTS (PPST/AKD-03)",
  withdrawal:       "PERMOHONAN BERHENTI PENGAJIAN / APPLICATION FOR WITHDRAWAL FROM STUDIES (PPST/AKD-01)",
  exam_replacement: "PERMOHONAN PEPERIKSAAN GANTIAN/ULANGAN / REPLACEMENT/REPEAT EXAMINATION (PPST/AKD-02)",
  room_booking:     "BORANG TEMPAHAN BILIK KULIAH/TUTORIAL / LECTURE ROOM BOOKING FORM (PPST/AKD-05)",
};

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).send("Invalid application ID.");
    }

    const a = await FormApplication.findById(req.params.id)
      .populate("user_id",     "name matric_staff_id email phone ic_number profile")
      .populate("admin_id",    "name matric_staff_id")
      .populate("pengarah_id", "name matric_staff_id")
      .lean();

    if (!a) return res.status(404).send("Application not found.");

    const u   = a.user_id || {};
    const pro = u.profile || {};
    const sl  = a.sick_leave_data    || {};
    const ar  = a.appeal_review_data || {};

    const statusBadge = {
      pending_admin:    '<span style="color:#b45309;font-weight:700;">⏳ Pending Admin Review</span>',
      pending_pengarah: '<span style="color:#1e40af;font-weight:700;">📋 Pending Pengarah Approval</span>',
      fully_approved:   '<span style="color:#065f46;font-weight:700;">✅ Fully Approved</span>',
      rejected:         '<span style="color:#991b1b;font-weight:700;">❌ Rejected</span>',
    }[a.status] || a.status;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>PPST Form — ${a._id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; font-size: 11pt; color: #111; background: #fff; }
    .page { max-width: 210mm; margin: 0 auto; padding: 18mm 18mm 15mm; }

    /* Header */
    .header { display: flex; align-items: flex-start; gap: 16px; border-bottom: 3px solid #003087; padding-bottom: 12px; margin-bottom: 14px; }
    .header-text h1 { font-size: 10pt; color: #003087; font-weight: 700; line-height: 1.4; }
    .header-text p  { font-size: 8.5pt; color: #555; line-height: 1.5; }
    .form-code { margin-left: auto; background: #003087; color: white; padding: 6px 12px; border-radius: 6px; font-size: 9pt; font-weight: 700; white-space: nowrap; }

    h2.form-title { font-size: 13pt; font-weight: 700; text-align: center; color: #003087; margin: 14px 0 16px; text-transform: uppercase; letter-spacing: 0.02em; }

    /* Sections */
    .section { border: 1px solid #ccc; border-radius: 4px; margin-bottom: 12px; overflow: hidden; }
    .section-title { background: #003087; color: white; padding: 5px 10px; font-size: 9pt; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .section-body { padding: 10px 12px; }

    /* Grid */
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
    .grid.three { grid-template-columns: 1fr 1fr 1fr; }
    .full { grid-column: 1 / -1; }
    .field { display: flex; flex-direction: column; gap: 2px; padding-bottom: 6px; border-bottom: 1px dotted #ddd; }
    .field:last-child { border-bottom: none; }
    .field label { font-size: 7.5pt; font-weight: 700; color: #003087; text-transform: uppercase; letter-spacing: 0.04em; }
    .field span   { font-size: 10pt; color: #111; min-height: 16px; }

    /* Table */
    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    th { background: #003087; color: white; padding: 5px 8px; text-align: left; font-size: 8.5pt; }
    td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #f8f9fc; }

    /* Approval */
    .approval-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .approval-box  { border: 1px solid #ccc; border-radius: 4px; padding: 10px; }
    .approval-box h4 { font-size: 8.5pt; font-weight: 700; color: #003087; margin-bottom: 8px; text-transform: uppercase; }
    .sig-line { border-top: 1px solid #333; margin-top: 28px; padding-top: 4px; font-size: 8pt; color: #555; }

    /* Stamp area */
    .stamp-area { border: 2px dashed #c8102e; border-radius: 8px; padding: 12px; text-align: center; min-height: 80px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 6px; }
    .stamp-area p { font-size: 8pt; color: #888; }

    /* Footer */
    .doc-footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #ccc; display: flex; justify-content: space-between; font-size: 8pt; color: #888; }

    @media print {
      body { font-size: 10pt; }
      .page { padding: 15mm; }
      .no-print { display: none !important; }
      @page { margin: 10mm; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Print Button (hidden when printing) -->
  <div class="no-print" style="text-align:right;margin-bottom:12px;">
    <button onclick="window.print()" style="background:#003087;color:white;border:none;padding:8px 20px;border-radius:6px;font-family:inherit;font-size:10pt;font-weight:600;cursor:pointer;">
      🖨️ Print / Save as PDF
    </button>
    <button onclick="window.close()" style="background:white;color:#555;border:1px solid #ccc;padding:8px 16px;border-radius:6px;font-family:inherit;font-size:10pt;cursor:pointer;margin-left:8px;">
      ✕ Close
    </button>
  </div>

  <!-- UMS Header -->
  <div class="header">
    <div class="header-text">
      <h1>UNIVERSITI MALAYSIA SABAH<br>PUSAT PERSEDIAAN SAINS DAN TEKNOLOGI</h1>
      <p>Jalan UMS, 88400 Kota Kinabalu, Sabah &nbsp;|&nbsp; Tel: (+6088) 320000 &nbsp;|&nbsp; pejppst@ums.edu.my</p>
    </div>
    <div class="form-code">${FORM_TITLES[a.form_type]?.match(/\(([^)]+)\)/)?.[1] || ""}</div>
  </div>

  <h2 class="form-title">${FORM_TITLES[a.form_type] || a.form_type}</h2>

  <!-- Status Banner -->
  <div style="text-align:center;margin-bottom:14px;font-size:10pt;">${statusBadge}</div>

  <!-- Section A: Applicant Information -->
  <div class="section">
    <div class="section-title">Bahagian A: Maklumat Pemohon / Applicant Information</div>
    <div class="section-body">
      <div class="grid">
        <div class="field"><label>Nama Pelajar / Student's Name</label><span>${u.name || "—"}</span></div>
        <div class="field"><label>No. Pelajar / Student ID</label><span>${u.matric_staff_id || "—"}</span></div>
        <div class="field"><label>Nombor Kad Pengenalan / IC Number</label><span>${u.ic_number || "—"}</span></div>
        <div class="field"><label>No. Telefon / Phone No.</label><span>${u.phone || "—"}</span></div>
        <div class="field"><label>Program Pengajian / Programme</label><span>${pro.program || "—"}</span></div>
        <div class="field"><label>Email</label><span>${u.email || "—"}</span></div>
        <div class="field"><label>Kumpulan Kuliah / Lecture Group</label><span>${pro.lecture_group || "—"}</span></div>
        <div class="field"><label>Kumpulan Tutorial / Tutorial Group</label><span>${pro.tutorial_group || "—"}</span></div>
        ${pro.address ? `<div class="field full"><label>Alamat / Address</label><span>${pro.address}</span></div>` : ""}
      </div>
    </div>
  </div>

  <!-- Section B: Application Details -->
  <div class="section">
    <div class="section-title">Bahagian B: Butiran Permohonan / Application Details</div>
    <div class="section-body">
      <div class="grid">
        <div class="field"><label>Tarikh Hantar / Submitted On</label><span>${fmt(a.createdAt)}</span></div>
        <div class="field"><label>Jenis Borang / Form Type</label><span>${a.form_type?.replace(/_/g," ").toUpperCase()}</span></div>
        ${a.start_date ? `<div class="field"><label>Tarikh Mula / From Date</label><span>${fmt(a.start_date)}</span></div>` : ""}
        ${a.end_date   ? `<div class="field"><label>Tarikh Tamat / To Date</label><span>${fmt(a.end_date)}</span></div>`   : ""}
        <div class="field full"><label>Sebab / Reason</label><span>${a.reason || "—"}</span></div>

        ${a.form_type === "sick_leave" ? `
        <div class="field"><label>Hospital / Clinic</label><span>${sl.hospital_name || "—"}</span></div>
        <div class="field"><label>Jenis Hospital / Type</label><span>${sl.hospital_type === "government" ? "Government / Kerajaan" : "Private / Swasta"}</span></div>
        ` : ""}

        ${a.form_type === "appeal_review" ? `
        <div class="field"><label>Kod Kursus / Course Code</label><span>${ar.course_code || "—"}</span></div>
        <div class="field"><label>Nama Kursus / Course Name</label><span>${ar.course_name || "—"}</span></div>
        <div class="field"><label>Gred / Grade</label><span>${ar.grade || "—"}</span></div>
        <div class="field"><label>Pensyarah / Lecturer</label><span>${ar.lecturer_name || "—"}</span></div>
        <div class="field"><label>Semester</label><span>${ar.semester || "—"}</span></div>
        <div class="field"><label>Sesi / Session</label><span>${ar.session || "—"}</span></div>
        <div class="field"><label>No. Resit / Receipt No.</label><span>${ar.receipt_no || "—"}</span></div>
        <div class="field"><label>Jumlah Bayaran / Amount Paid</label><span>RM ${Number(ar.amount_paid || 0).toFixed(2)}</span></div>
        ` : ""}
      </div>
    </div>
  </div>

  <!-- Signature: Student -->
  <div class="section">
    <div class="section-title">Tandatangan Pelajar / Student's Signature</div>
    <div class="section-body" style="display:flex;gap:40px;align-items:flex-end;">
      <div style="flex:1;">
        <div class="sig-line">Tandatangan / Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
        <p style="font-size:8pt;color:#555;margin-top:4px;">Nama: ${u.name || ""}</p>
      </div>
      <div style="flex:1;">
        <div class="sig-line">Tarikh / Date: ${fmt(a.createdAt)}</div>
      </div>
    </div>
  </div>

  <!-- Official Use -->
  <div class="section">
    <div class="section-title">Untuk Kegunaan Pejabat / For Office Use Only</div>
    <div class="section-body">
      <div class="approval-grid">

        <!-- Admin Approval -->
        <div class="approval-box">
          <h4>Kelulusan Admin (Tier 1) / Admin Approval</h4>
          <p style="font-size:9pt;margin-bottom:6px;">
            ${a.admin_id ? `✅ Diluluskan / Approved by: <strong>${a.admin_id.name || "—"}</strong><br>
            Tarikh: ${fmt(a.admin_approved_at)}` : "⏳ Belum diproses / Pending"}
          </p>
          ${a.admin_comment ? `<p style="font-size:8.5pt;color:#555;background:#f8f9fc;padding:6px;border-radius:4px;margin-top:6px;">Ulasan: ${a.admin_comment}</p>` : ""}
          <div class="sig-line">Tandatangan &amp; Cop / Signature &amp; Stamp</div>
        </div>

        <!-- Pengarah Approval -->
        <div class="approval-box">
          <h4>Kelulusan Pengarah (Tier 2) / Director's Approval</h4>
          ${a.pengarah_id ? `
          <p style="font-size:9pt;margin-bottom:6px;">
            ${a.status === "fully_approved" ? "✅" : "❌"} ${a.status === "fully_approved" ? "Diluluskan" : "Ditolak"} by: <strong>${a.pengarah_id.name || "—"}</strong><br>
            Tarikh: ${fmt(a.pengarah_approved_at)}
          </p>
          ${a.pengarah_comment ? `<p style="font-size:8.5pt;color:#555;background:#f8f9fc;padding:6px;border-radius:4px;margin-top:6px;">Ulasan: ${a.pengarah_comment}</p>` : ""}
          ${a.signature_path ? `<img src="${a.signature_path}" style="max-height:50px;margin-top:8px;" alt="Digital Signature"/>` : ""}
          ` : `<div class="stamp-area"><p>⏳ Menunggu kelulusan Pengarah<br>Awaiting Director's Approval</p></div>`}
          <div class="sig-line">Tandatangan Pengarah &amp; Cop / Director's Signature &amp; Stamp</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="doc-footer">
    <span>Pusat Persediaan Sains dan Teknologi / Preparatory Centre for Science &amp; Technology, UMS</span>
    <span>Dicetak pada / Printed on: ${new Date().toLocaleDateString("en-MY")}</span>
  </div>

</div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    console.error("❌ print/:id:", err);
    return res.status(500).send(`<p>Error generating form: ${err.message}</p>`);
  }
});

module.exports = router;
