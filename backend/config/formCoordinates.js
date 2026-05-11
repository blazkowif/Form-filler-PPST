// =============================================================
// config/formCoordinates.js
// (X, Y) coordinate maps for each PPST AKD form.
// Origin is bottom-left of A4 page (595 × 842 pts).
// All measurements are in PDF points (1 pt ≈ 0.352 mm).
// Upload the original AKD-01 … AKD-06 PDFs to:
//   backend/assets/forms/AKD-01.pdf … AKD-06.pdf
// then fine-tune the numbers below with a PDF ruler tool.
// =============================================================

const FONT_SIZE_NORMAL = 10;
const FONT_SIZE_SMALL  = 8.5;
const TICK_SIZE        = 11;   // checkbox tick font size

// ─────────────────────────────────────────────────────────────
// AKD-01 — Withdrawal (Penarikan Diri)
// ─────────────────────────────────────────────────────────────
const AKD01 = {
  pdfFile: "AKD-01.pdf",
  fields: [
    // Student profile block
    { key: "student_name",   x: 210, y: 710, fontSize: FONT_SIZE_NORMAL },
    { key: "matric_no",      x: 210, y: 693, fontSize: FONT_SIZE_NORMAL },
    { key: "programme",      x: 210, y: 676, fontSize: FONT_SIZE_NORMAL },
    { key: "phone_no",       x: 210, y: 659, fontSize: FONT_SIZE_NORMAL },
    { key: "address",        x: 210, y: 642, fontSize: FONT_SIZE_SMALL  },

    // Reason ticks — place "✓" at the matching box
    { key: "tick_job_offer",        x: 68,  y: 592, fontSize: TICK_SIZE, conditional: "withdrawal_reason", matchValue: "job_offer" },
    { key: "tick_transfer",         x: 68,  y: 575, fontSize: TICK_SIZE, conditional: "withdrawal_reason", matchValue: "transfer" },
    { key: "tick_personal",         x: 68,  y: 558, fontSize: TICK_SIZE, conditional: "withdrawal_reason", matchValue: "personal" },

    // New institution (shown when transfer)
    { key: "institution_name",      x: 210, y: 575, fontSize: FONT_SIZE_NORMAL },

    // Date of request
    { key: "student_signature_date", x: 350, y: 430, fontSize: FONT_SIZE_NORMAL },

    // Official use
    { key: "admin_remarks",     x: 150, y: 310, fontSize: FONT_SIZE_SMALL  },
    { key: "tick_approved",     x:  68, y: 270, fontSize: TICK_SIZE, conditional: "status", matchValue: "fully_approved" },
    { key: "tick_not_approved", x: 168, y: 270, fontSize: TICK_SIZE, conditional: "status", matchValue: "rejected" },
    { key: "director_remarks",  x: 150, y: 230, fontSize: FONT_SIZE_SMALL  },
    { key: "decision_date",     x: 380, y: 170, fontSize: FONT_SIZE_NORMAL },
  ],
};

// ─────────────────────────────────────────────────────────────
// AKD-02 — Examination Appeal (Rayuan Peperiksaan)
// ─────────────────────────────────────────────────────────────
const AKD02 = {
  pdfFile: "AKD-02.pdf",
  fields: [
    { key: "student_name",   x: 210, y: 710, fontSize: FONT_SIZE_NORMAL },
    { key: "matric_no",      x: 210, y: 693, fontSize: FONT_SIZE_NORMAL },
    { key: "programme",      x: 210, y: 676, fontSize: FONT_SIZE_NORMAL },
    { key: "phone_no",       x: 210, y: 659, fontSize: FONT_SIZE_NORMAL },
    { key: "semester",       x: 210, y: 642, fontSize: FONT_SIZE_NORMAL },
    { key: "appeal_session", x: 350, y: 642, fontSize: FONT_SIZE_NORMAL },

    // Reason ticks
    { key: "tick_illness", x: 68, y: 590, fontSize: TICK_SIZE, conditional: "appeal_reason", matchValue: "illness" },
    { key: "tick_death",   x: 68, y: 573, fontSize: TICK_SIZE, conditional: "appeal_reason", matchValue: "death"   },
    { key: "tick_failed",  x: 68, y: 556, fontSize: TICK_SIZE, conditional: "appeal_reason", matchValue: "failed"  },

    // Course table row 1 (expand as needed)
    { key: "course_code_1",  x:  68, y: 502, fontSize: FONT_SIZE_SMALL },
    { key: "course_name_1",  x: 140, y: 502, fontSize: FONT_SIZE_SMALL },
    { key: "exam_date_1",    x: 370, y: 502, fontSize: FONT_SIZE_SMALL },

    // Official use
    { key: "admin_remarks",     x: 150, y: 310, fontSize: FONT_SIZE_SMALL  },
    { key: "tick_approved",     x:  68, y: 270, fontSize: TICK_SIZE, conditional: "status", matchValue: "fully_approved" },
    { key: "tick_not_approved", x: 168, y: 270, fontSize: TICK_SIZE, conditional: "status", matchValue: "rejected" },
    { key: "director_remarks",  x: 150, y: 230, fontSize: FONT_SIZE_SMALL  },
    { key: "decision_date",     x: 380, y: 170, fontSize: FONT_SIZE_NORMAL },
  ],
};

// ─────────────────────────────────────────────────────────────
// AKD-03 — Result Review (Semakan Keputusan)
// ─────────────────────────────────────────────────────────────
const AKD03 = {
  pdfFile: "AKD-03.pdf",
  fields: [
    { key: "student_name",   x: 210, y: 710, fontSize: FONT_SIZE_NORMAL },
    { key: "matric_no",      x: 210, y: 693, fontSize: FONT_SIZE_NORMAL },
    { key: "programme",      x: 210, y: 676, fontSize: FONT_SIZE_NORMAL },
    { key: "phone_no",       x: 210, y: 659, fontSize: FONT_SIZE_NORMAL },

    // Payment details
    { key: "receipt_no",   x: 210, y: 630, fontSize: FONT_SIZE_NORMAL },
    { key: "receipt_date", x: 350, y: 630, fontSize: FONT_SIZE_NORMAL },
    { key: "amount_paid",  x: 210, y: 613, fontSize: FONT_SIZE_NORMAL },

    // Course table row 1
    { key: "course_code_1",     x:  50, y: 555, fontSize: FONT_SIZE_SMALL },
    { key: "course_name_1",     x: 120, y: 555, fontSize: FONT_SIZE_SMALL },
    { key: "appeal_lecturer_1", x: 270, y: 555, fontSize: FONT_SIZE_SMALL },
    { key: "grade_1",           x: 380, y: 555, fontSize: FONT_SIZE_SMALL },
    { key: "faculty_1",         x: 430, y: 555, fontSize: FONT_SIZE_SMALL },

    // Official use
    { key: "admin_remarks",     x: 150, y: 310, fontSize: FONT_SIZE_SMALL  },
    { key: "tick_approved",     x:  68, y: 270, fontSize: TICK_SIZE, conditional: "status", matchValue: "fully_approved" },
    { key: "tick_not_approved", x: 168, y: 270, fontSize: TICK_SIZE, conditional: "status", matchValue: "rejected" },
    { key: "director_remarks",  x: 150, y: 230, fontSize: FONT_SIZE_SMALL  },
    { key: "decision_date",     x: 380, y: 170, fontSize: FONT_SIZE_NORMAL },
  ],
};

// ─────────────────────────────────────────────────────────────
// AKD-04 — Absence Justification (Justifikasi Ketidakhadiran)
// ─────────────────────────────────────────────────────────────
const AKD04 = {
  pdfFile: "AKD-04.pdf",
  fields: [
    { key: "student_name",   x: 210, y: 710, fontSize: FONT_SIZE_NORMAL },
    { key: "matric_no",      x: 210, y: 693, fontSize: FONT_SIZE_NORMAL },
    { key: "programme",      x: 210, y: 676, fontSize: FONT_SIZE_NORMAL },
    { key: "phone_no",       x: 210, y: 659, fontSize: FONT_SIZE_NORMAL },

    // Absence details
    { key: "reason_text",      x:  68, y: 610, fontSize: FONT_SIZE_SMALL  },
    { key: "date_of_absence",  x: 380, y: 640, fontSize: FONT_SIZE_NORMAL },

    // Class table row 1
    { key: "absence_course_code_1", x:  50, y: 558, fontSize: FONT_SIZE_SMALL },
    { key: "absence_course_name_1", x: 130, y: 558, fontSize: FONT_SIZE_SMALL },
    { key: "class_type_1",          x: 350, y: 558, fontSize: FONT_SIZE_SMALL },

    // Official use
    { key: "admin_remarks",     x: 150, y: 310, fontSize: FONT_SIZE_SMALL  },
    { key: "tick_approved",     x:  68, y: 270, fontSize: TICK_SIZE, conditional: "status", matchValue: "fully_approved" },
    { key: "tick_not_approved", x: 168, y: 270, fontSize: TICK_SIZE, conditional: "status", matchValue: "rejected" },
    { key: "director_remarks",  x: 150, y: 230, fontSize: FONT_SIZE_SMALL  },
    { key: "decision_date",     x: 380, y: 170, fontSize: FONT_SIZE_NORMAL },
  ],
};

// ─────────────────────────────────────────────────────────────
// AKD-05 — Room Booking (Tempahan Bilik)
// ─────────────────────────────────────────────────────────────
const AKD05 = {
  pdfFile: "AKD-05.pdf",
  fields: [
    { key: "student_name",      x: 210, y: 710, fontSize: FONT_SIZE_NORMAL },
    { key: "matric_no",         x: 210, y: 693, fontSize: FONT_SIZE_NORMAL },
    { key: "programme",         x: 210, y: 676, fontSize: FONT_SIZE_NORMAL },
    { key: "phone_no",          x: 210, y: 659, fontSize: FONT_SIZE_NORMAL },
    { key: "applicant_position",x: 210, y: 642, fontSize: FONT_SIZE_NORMAL },

    // Room ticks — BK 1-4
    { key: "tick_bk1", x:  68, y: 590, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BK1" },
    { key: "tick_bk2", x: 108, y: 590, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BK2" },
    { key: "tick_bk3", x: 148, y: 590, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BK3" },
    { key: "tick_bk4", x: 188, y: 590, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BK4" },

    // BT PPST 1-5
    { key: "tick_bt1", x:  68, y: 570, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BT1" },
    { key: "tick_bt2", x: 108, y: 570, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BT2" },
    { key: "tick_bt3", x: 148, y: 570, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BT3" },
    { key: "tick_bt4", x: 188, y: 570, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BT4" },
    { key: "tick_bt5", x: 228, y: 570, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BT5" },

    // BT Annex 6-9
    { key: "tick_bta6", x:  68, y: 550, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BTA6" },
    { key: "tick_bta7", x: 108, y: 550, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BTA7" },
    { key: "tick_bta8", x: 148, y: 550, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BTA8" },
    { key: "tick_bta9", x: 188, y: 550, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BTA9" },

    { key: "purpose",       x: 68,  y: 510, fontSize: FONT_SIZE_NORMAL },
    { key: "booking_date",  x: 380, y: 510, fontSize: FONT_SIZE_NORMAL },

    // Official use
    { key: "admin_remarks",     x: 150, y: 310, fontSize: FONT_SIZE_SMALL  },
    { key: "tick_approved",     x:  68, y: 270, fontSize: TICK_SIZE, conditional: "status", matchValue: "fully_approved" },
    { key: "tick_not_approved", x: 168, y: 270, fontSize: TICK_SIZE, conditional: "status", matchValue: "rejected" },
    { key: "director_remarks",  x: 150, y: 230, fontSize: FONT_SIZE_SMALL  },
    { key: "decision_date",     x: 380, y: 170, fontSize: FONT_SIZE_NORMAL },
  ],
};

// ─────────────────────────────────────────────────────────────
// AKD-06 — Sick Leave (Cuti Sakit)
// ─────────────────────────────────────────────────────────────
const AKD06 = {
  pdfFile: "AKD-06.pdf",
  fields: [
    { key: "student_name",   x: 210, y: 710, fontSize: FONT_SIZE_NORMAL },
    { key: "matric_no",      x: 210, y: 693, fontSize: FONT_SIZE_NORMAL },
    { key: "programme",      x: 210, y: 676, fontSize: FONT_SIZE_NORMAL },
    { key: "phone_no",       x: 210, y: 659, fontSize: FONT_SIZE_NORMAL },
    { key: "ic_no",          x: 210, y: 642, fontSize: FONT_SIZE_NORMAL },
    { key: "study_group",    x: 210, y: 625, fontSize: FONT_SIZE_NORMAL },

    // Facility tick
    { key: "tick_govt_facility",    x:  68, y: 590, fontSize: TICK_SIZE, conditional: "hospital_type", matchValue: "government" },
    { key: "tick_private_facility", x: 178, y: 590, fontSize: TICK_SIZE, conditional: "hospital_type", matchValue: "private"    },
    { key: "hospital_name",         x: 210, y: 572, fontSize: FONT_SIZE_NORMAL },

    // Class tick
    { key: "tick_lecture",   x:  68, y: 545, fontSize: TICK_SIZE, conditional: "class_type", matchValue: "lecture"   },
    { key: "tick_tutorial",  x: 148, y: 545, fontSize: TICK_SIZE, conditional: "class_type", matchValue: "tutorial"  },
    { key: "tick_practical", x: 238, y: 545, fontSize: TICK_SIZE, conditional: "class_type", matchValue: "practical" },

    // Sick leave period
    { key: "start_date", x: 210, y: 515, fontSize: FONT_SIZE_NORMAL },
    { key: "end_date",   x: 350, y: 515, fontSize: FONT_SIZE_NORMAL },

    // Official use
    { key: "admin_remarks",     x: 150, y: 310, fontSize: FONT_SIZE_SMALL  },
    { key: "tick_approved",     x:  68, y: 270, fontSize: TICK_SIZE, conditional: "status", matchValue: "fully_approved" },
    { key: "tick_not_approved", x: 168, y: 270, fontSize: TICK_SIZE, conditional: "status", matchValue: "rejected" },
    { key: "director_remarks",  x: 150, y: 230, fontSize: FONT_SIZE_SMALL  },
    { key: "decision_date",     x: 380, y: 170, fontSize: FONT_SIZE_NORMAL },
  ],
};

// ─────────────────────────────────────────────────────────────
// Map form_type strings → coordinate config
// ─────────────────────────────────────────────────────────────
const FORM_MAP = {
  withdrawal:       AKD01,
  exam_replacement: AKD02,
  appeal_review:    AKD03,
  non_sick_leave:   AKD04,
  room_booking:     AKD05,
  sick_leave:       AKD06,
};

module.exports = { FORM_MAP };
