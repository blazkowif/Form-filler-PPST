// =============================================================
// config/formCoordinates.js
// (X, Y) coordinate maps for each PPST AKD form.
// Origin is bottom-left of A4 page (595 x 842 pts).
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
    { key: "student_name",   x: 210, y: 710, fontSize: FONT_SIZE_NORMAL },
    { key: "matric_no",      x: 210, y: 693, fontSize: FONT_SIZE_NORMAL },
    { key: "programme",      x: 210, y: 676, fontSize: FONT_SIZE_NORMAL },
    { key: "phone_no",       x: 210, y: 659, fontSize: FONT_SIZE_NORMAL },
    { key: "address",        x: 210, y: 642, fontSize: FONT_SIZE_SMALL  },

    { key: "tick_job_offer",        x: 68,  y: 592, fontSize: TICK_SIZE, conditional: "withdrawal_reason", matchValue: "job_offer" },
    { key: "tick_transfer",         x: 68,  y: 575, fontSize: TICK_SIZE, conditional: "withdrawal_reason", matchValue: "transfer" },
    { key: "tick_personal",         x: 68,  y: 558, fontSize: TICK_SIZE, conditional: "withdrawal_reason", matchValue: "personal" },

    { key: "institution_name",      x: 210, y: 575, fontSize: FONT_SIZE_NORMAL },

    { key: "student_signature_date", x: 350, y: 430, fontSize: FONT_SIZE_NORMAL },

    { key: "director_comments",     x: 150, y: 310, fontSize: FONT_SIZE_SMALL  },
    { key: "director_approved_tick",     x:  68, y: 270, fontSize: TICK_SIZE, conditional: "approval_status", matchValue: "fully_approved" },
    { key: "director_not_approved_tick", x: 168, y: 270, fontSize: TICK_SIZE, conditional: "approval_status", matchValue: "rejected" },
    { key: "director_date",     x: 380, y: 170, fontSize: FONT_SIZE_NORMAL },
  ],
};

// ─────────────────────────────────────────────────────────────
// AKD-02 — Exam Replacement (Peperiksaan Gantian/Ulangan)
// ─────────────────────────────────────────────────────────────
const AKD02 = {
  pdfFile: "AKD-02.pdf",
  fields: [
    { key: "student_no",       x: 210, y: 710, fontSize: FONT_SIZE_NORMAL },
    { key: "student_name",     x: 210, y: 693, fontSize: FONT_SIZE_NORMAL },
    { key: "phone_no",         x: 210, y: 676, fontSize: FONT_SIZE_NORMAL },
    { key: "centre",           x: 210, y: 659, fontSize: FONT_SIZE_NORMAL },
    { key: "programme",        x: 210, y: 642, fontSize: FONT_SIZE_NORMAL },
    { key: "semester",         x: 210, y: 625, fontSize: FONT_SIZE_NORMAL },
    { key: "session",          x: 350, y: 625, fontSize: FONT_SIZE_NORMAL },

    { key: "tick_illness", x: 68, y: 590, fontSize: TICK_SIZE, conditional: "exam_reason", matchValue: "illness" },
    { key: "tick_death",   x: 68, y: 573, fontSize: TICK_SIZE, conditional: "exam_reason", matchValue: "death"   },
    { key: "tick_failed",  x: 68, y: 556, fontSize: TICK_SIZE, conditional: "exam_reason", matchValue: "failed"  },

    { key: "course_row_1_code",      x:  68, y: 502, fontSize: FONT_SIZE_SMALL },
    { key: "course_row_1_name",      x: 140, y: 502, fontSize: FONT_SIZE_SMALL },
    { key: "course_row_1_exam_dt",   x: 370, y: 502, fontSize: FONT_SIZE_SMALL },

    { key: "student_date",  x: 210, y: 450, fontSize: FONT_SIZE_NORMAL },

    { key: "director_comments",     x: 150, y: 310, fontSize: FONT_SIZE_SMALL  },
    { key: "director_approved_tick",     x:  68, y: 270, fontSize: TICK_SIZE, conditional: "approval_status", matchValue: "fully_approved" },
    { key: "director_not_approved_tick", x: 168, y: 270, fontSize: TICK_SIZE, conditional: "approval_status", matchValue: "rejected" },
    { key: "director_date",     x: 380, y: 170, fontSize: FONT_SIZE_NORMAL },
  ],
};

// ─────────────────────────────────────────────────────────────
// AKD-03 — Appeal Review (Rayuan Semakan Semula Keputusan)
// ─────────────────────────────────────────────────────────────
const AKD03 = {
  pdfFile: "AKD-03.pdf",
  fields: [
    { key: "student_no",       x: 210, y: 710, fontSize: FONT_SIZE_NORMAL },
    { key: "programme",        x: 210, y: 693, fontSize: FONT_SIZE_NORMAL },
    { key: "student_name",     x: 210, y: 676, fontSize: FONT_SIZE_NORMAL },
    { key: "receipt_no",       x: 210, y: 659, fontSize: FONT_SIZE_NORMAL },
    { key: "receipt_date",     x: 350, y: 659, fontSize: FONT_SIZE_NORMAL },
    { key: "amount_paid",      x: 210, y: 642, fontSize: FONT_SIZE_NORMAL },
    { key: "faculty",          x: 210, y: 625, fontSize: FONT_SIZE_NORMAL },
    { key: "phone_no",         x: 210, y: 608, fontSize: FONT_SIZE_NORMAL },
    { key: "semester",         x: 210, y: 591, fontSize: FONT_SIZE_NORMAL },
    { key: "session",          x: 350, y: 591, fontSize: FONT_SIZE_NORMAL },

    { key: "course_row_1_code",       x:  50, y: 555, fontSize: FONT_SIZE_SMALL },
    { key: "course_row_1_name",       x: 120, y: 555, fontSize: FONT_SIZE_SMALL },
    { key: "course_row_1_grade",      x: 380, y: 555, fontSize: FONT_SIZE_SMALL },
    { key: "course_row_1_lecturer",   x: 270, y: 555, fontSize: FONT_SIZE_SMALL },
    { key: "course_row_1_offering_centre", x: 430, y: 555, fontSize: FONT_SIZE_SMALL },

    { key: "student_date",  x: 210, y: 500, fontSize: FONT_SIZE_NORMAL },

    { key: "director_comments",     x: 150, y: 310, fontSize: FONT_SIZE_SMALL  },
    { key: "director_approved_tick",     x:  68, y: 270, fontSize: TICK_SIZE, conditional: "approval_status", matchValue: "fully_approved" },
    { key: "director_not_approved_tick", x: 168, y: 270, fontSize: TICK_SIZE, conditional: "approval_status", matchValue: "rejected" },
    { key: "director_date",     x: 380, y: 170, fontSize: FONT_SIZE_NORMAL },
  ],
};

// ─────────────────────────────────────────────────────────────
// AKD-04 — Absence Justification (Tunjuk Sebab Tidak Hadir)
// ─────────────────────────────────────────────────────────────
const AKD04 = {
  pdfFile: "AKD-04.pdf",
  fields: [
    { key: "student_name",   x: 210, y: 710, fontSize: FONT_SIZE_NORMAL },
    { key: "student_no",     x: 210, y: 693, fontSize: FONT_SIZE_NORMAL },
    { key: "programme",      x: 210, y: 676, fontSize: FONT_SIZE_NORMAL },
    { key: "phone_no",       x: 210, y: 659, fontSize: FONT_SIZE_NORMAL },
    { key: "address",        x: 210, y: 642, fontSize: FONT_SIZE_SMALL  },

    { key: "reason_text",      x:  68, y: 610, fontSize: FONT_SIZE_SMALL  },
    { key: "date_of_absence",  x: 380, y: 640, fontSize: FONT_SIZE_NORMAL },

    { key: "course_row_1_code",     x:  50, y: 558, fontSize: FONT_SIZE_SMALL },
    { key: "course_row_1_name",     x: 130, y: 558, fontSize: FONT_SIZE_SMALL },

    { key: "student_date",  x: 210, y: 490, fontSize: FONT_SIZE_NORMAL },

    { key: "director_comments",     x: 150, y: 310, fontSize: FONT_SIZE_SMALL  },
    { key: "director_approved_tick",     x:  68, y: 270, fontSize: TICK_SIZE, conditional: "approval_status", matchValue: "fully_approved" },
    { key: "director_not_approved_tick", x: 168, y: 270, fontSize: TICK_SIZE, conditional: "approval_status", matchValue: "rejected" },
    { key: "director_date",     x: 380, y: 170, fontSize: FONT_SIZE_NORMAL },
  ],
};

// ─────────────────────────────────────────────────────────────
// AKD-05 — Room Booking (Tempahan Bilik)
// ─────────────────────────────────────────────────────────────
const AKD05 = {
  pdfFile: "AKD-05.pdf",
  fields: [
    { key: "applicant_name",   x: 210, y: 710, fontSize: FONT_SIZE_NORMAL },
    { key: "position",         x: 210, y: 693, fontSize: FONT_SIZE_NORMAL },
    { key: "phone_no",         x: 210, y: 676, fontSize: FONT_SIZE_NORMAL },

    { key: "tick_bk_1", x:  68, y: 640, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BK1" },
    { key: "tick_bk_2", x: 108, y: 640, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BK2" },
    { key: "tick_bk_3", x: 148, y: 640, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BK3" },
    { key: "tick_bk_4", x: 188, y: 640, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BK4" },

    { key: "tick_bt_1", x:  68, y: 620, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BT1" },
    { key: "tick_bt_2", x: 108, y: 620, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BT2" },
    { key: "tick_bt_3", x: 148, y: 620, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BT3" },
    { key: "tick_bt_4", x: 188, y: 620, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BT4" },
    { key: "tick_bt_5", x: 228, y: 620, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BT5" },

    { key: "tick_bta_6", x:  68, y: 600, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BTA6" },
    { key: "tick_bta_7", x: 108, y: 600, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BTA7" },
    { key: "tick_bta_8", x: 148, y: 600, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BTA8" },
    { key: "tick_bta_9", x: 188, y: 600, fontSize: TICK_SIZE, conditional: "room_choice", matchValue: "BTA9" },

    { key: "purpose",       x: 68,  y: 560, fontSize: FONT_SIZE_NORMAL },
    { key: "booking_date",  x: 380, y: 560, fontSize: FONT_SIZE_NORMAL },

    { key: "student_date",  x: 210, y: 500, fontSize: FONT_SIZE_NORMAL },

    { key: "director_comments",     x: 150, y: 310, fontSize: FONT_SIZE_SMALL  },
    { key: "director_approved_tick",     x:  68, y: 270, fontSize: TICK_SIZE, conditional: "approval_status", matchValue: "fully_approved" },
    { key: "director_not_approved_tick", x: 168, y: 270, fontSize: TICK_SIZE, conditional: "approval_status", matchValue: "rejected" },
    { key: "director_date",     x: 380, y: 170, fontSize: FONT_SIZE_NORMAL },
  ],
};

// ─────────────────────────────────────────────────────────────
// AKD-06 — Sick Leave (Cuti Sakit)
// ─────────────────────────────────────────────────────────────
const AKD06 = {
  pdfFile: "AKD-06.pdf",
  fields: [
    { key: "student_name",   x: 210, y: 710, fontSize: FONT_SIZE_NORMAL },
    { key: "ic_number",      x: 210, y: 693, fontSize: FONT_SIZE_NORMAL },
    { key: "matric_no",      x: 210, y: 676, fontSize: FONT_SIZE_NORMAL },
    { key: "phone_no",       x: 210, y: 659, fontSize: FONT_SIZE_NORMAL },

    { key: "tick_kuliah",    x: 68,  y: 630, fontSize: TICK_SIZE, conditional: "class_group", matchValue: "kuliah"   },
    { key: "tick_tutorial",  x: 148, y: 630, fontSize: TICK_SIZE, conditional: "class_group", matchValue: "tutorial" },
    { key: "tick_amali",     x: 238, y: 630, fontSize: TICK_SIZE, conditional: "class_group", matchValue: "amali"    },

    { key: "tick_kerajaan",  x: 68,  y: 610, fontSize: TICK_SIZE, conditional: "hospital_type", matchValue: "government" },
    { key: "tick_swasta",    x: 178, y: 610, fontSize: TICK_SIZE, conditional: "hospital_type", matchValue: "private"    },

    { key: "student_date",  x: 210, y: 570, fontSize: FONT_SIZE_NORMAL },

    { key: "director_comments",     x: 150, y: 310, fontSize: FONT_SIZE_SMALL  },
    { key: "director_approved_tick",     x:  68, y: 270, fontSize: TICK_SIZE, conditional: "approval_status", matchValue: "fully_approved" },
    { key: "director_not_approved_tick", x: 168, y: 270, fontSize: TICK_SIZE, conditional: "approval_status", matchValue: "rejected" },
    { key: "director_date",     x: 380, y: 170, fontSize: FONT_SIZE_NORMAL },
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
