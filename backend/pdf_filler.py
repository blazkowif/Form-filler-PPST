#!/usr/bin/env python3
"""
PPST E-Portal — PDF Form Filler
================================
Usage:  echo '<json>' | python3 pdf_filler.py <form_type>
Output: Raw PDF bytes on stdout

Approach
--------
1.  Load the original AKD-XX.pdf template with pypdf.
2.  Build a transparent ReportLab overlay containing the student's data
    at manually-measured (x, y) coordinates (PDF points, origin = bottom-left).
3.  Merge the overlay page onto the template page with pypdf.
4.  Stream the merged bytes to stdout so the Node.js caller can pipe
    the response directly to the browser.

Coordinate system
-----------------
A4 page  = 595 x 842 points
Origin   = bottom-left corner
1 pt     = 0.352 mm
Use a PDF ruler (e.g. open the PDF in Adobe Acrobat → View → Show/Hide
→ Rulers & Grids, or use a Python script with pdf_reader to inspect a
page's mediabox and measure interactively) to find the exact (x, y).

HOW TO CALIBRATE
-----------------
Run the helper at the bottom of this file with --calibrate to get a
dot-grid overlay printed on a copy of a template so you can read off
exact coordinates.

    python3 pdf_filler.py --calibrate AKD-01
"""

import sys
import json
import io
import os
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, black
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import pypdf

# ─────────────────────────────────────────────────────────────────────────────
# Path config
# ─────────────────────────────────────────────────────────────────────────────
FORMS_DIR = os.path.join(os.path.dirname(__file__), "assets", "forms")

# ─────────────────────────────────────────────────────────────────────────────
# Colour presets
# ─────────────────────────────────────────────────────────────────────────────
INK_BLUE   = HexColor("#0d1a40")   # student-filled fields
INK_RED    = HexColor("#8b0000")   # official-use / approval fields
INK_TICK   = HexColor("#005f00")   # tick marks / checkboxes

# ─────────────────────────────────────────────────────────────────────────────
# Font sizes
# ─────────────────────────────────────────────────────────────────────────────
FS_NORMAL = 10
FS_SMALL  = 8.5
FS_TICK   = 12   # the "✓" character

PAGE_W, PAGE_H = A4   # 595.27 x 841.89


# =============================================================================
# COORDINATE MAPS
# =============================================================================
# Each entry is a dict:
#   key          – data key from the JSON payload
#   x, y         – TODO: fill in after measuring your PDF
#   fs           – font size
#   color        – INK_BLUE | INK_RED | INK_TICK
#   conditional  – (optional) only draw when data[conditional] == match_value
#   match_value  – value to compare against
#   text_override– (optional) static text to draw regardless of data value
#   max_width    – (optional) wrap text beyond this many points
#
# All (x, y) values below are PLACEHOLDER = 0, 0.
# Open the PDF in a viewer with a point ruler and replace them.
# =============================================================================

COORDS = {

    # ─────────────────────────────────────────────────────────────────────
    # AKD-01  Permohonan Berhenti Pengajian (Withdrawal)
    # Page 1 of 1
    # ─────────────────────────────────────────────────────────────────────
    "AKD-01": {
        "pdf_file": "AKD-01.pdf",
        "pages": 1,
        "fields": [
            # ── BAHAGIAN A: MAKLUMAT PEMOHON ──────────────────────────
            {"key": "student_name",  "x": 208, "y": 656, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "student_no",    "x": 480, "y": 656, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "programme",     "x": 195, "y": 636, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "phone_no",      "x": 492, "y": 634, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "address",       "x": 157, "y": 617, "fs": FS_SMALL,  "color": INK_BLUE},

            # ── BUTIRAN PERMOHONAN: reason ticks ──────────────────────
            # Tick for "Mendapat tawaran pekerjaan"
            {"key": "tick_job_offer",
             "x": 104, "y": 540, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "withdrawal_reason", "match_value": "job_offer",
             "text_override": "/"},

            # Tick for "Melanjutkan pengajian di institusi lain"
            {"key": "tick_transfer",
             "x": 104, "y": 520, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "withdrawal_reason", "match_value": "transfer",
             "text_override": "/"},

            # Institution name (only when transfer)
            {"key": "institution_name",
             "x": 325, "y": 526, "fs": FS_NORMAL, "color": INK_BLUE,
             "conditional": "withdrawal_reason", "match_value": "transfer"},

            # Tick for "Masalah peribadi"
            {"key": "tick_personal",
             "x": 104, "y": 494, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "withdrawal_reason", "match_value": "personal",
             "text_override": "/"},

            # ── STUDENT SIGNATURE DATE ────────────────────────────────
            {"key": "student_date",  "x": 424, "y": 273, "fs": FS_NORMAL, "color": INK_BLUE},

            # ── UNTUK KEGUNAAN PEJABAT (Official use) ─────────────────
            # Director's comments text
            {"key": "director_comments", "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_RED},

            # Approved tick
            {"key": "director_approved_tick",
             "x": 156, "y": 152, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "approval_status", "match_value": "fully_approved",
             "text_override": "/"},

            # Not approved tick
            {"key": "director_not_approved_tick",
             "x": 156, "y": 126, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "approval_status", "match_value": "rejected",
             "text_override": "/"},

            # Director date
            {"key": "director_date",  "x": 408, "y": 81, "fs": FS_NORMAL, "color": INK_RED},
        ],
    },

    # ─────────────────────────────────────────────────────────────────────
    # AKD-02  Permohonan Peperiksaan Gantian/Ulangan (Exam Replacement)
    # Page 1 → student section  |  Page 2 → official use
    # ─────────────────────────────────────────────────────────────────────
    "AKD-02": {
        "pdf_file": "AKD-02.pdf",
        "pages": 2,
        "fields": [
            # ── PAGE 1 — Student section ──────────────────────────────
            {"key": "student_no",    "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "student_name",  "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "phone_no",      "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "centre",        "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "programme",     "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "semester",      "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "session",       "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},

            # Reason ticks
            {"key": "tick_illness",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK, "page": 1,
             "conditional": "exam_reason", "match_value": "illness", "text_override": "/"},
            {"key": "tick_death",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK, "page": 1,
             "conditional": "exam_reason", "match_value": "death",   "text_override": "/"},
            {"key": "tick_failed",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK, "page": 1,
             "conditional": "exam_reason", "match_value": "failed",  "text_override": "/"},

            # Course table – row 1  (add rows 2–5 by duplicating with incremented y)
            {"key": "course_row_1_no",        "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_1_code",      "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_1_name",      "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_1_exam_dt",   "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            # Row 2
            {"key": "course_row_2_no",        "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_2_code",      "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_2_name",      "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_2_exam_dt",   "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            # Row 3
            {"key": "course_row_3_no",        "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_3_code",      "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_3_name",      "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_3_exam_dt",   "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},

            {"key": "student_date",  "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},

            # ── PAGE 2 — Official use ─────────────────────────────────
            # Director agree / disagree ticks
            {"key": "director_agree_tick",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK, "page": 2,
             "conditional": "approval_status", "match_value": "fully_approved", "text_override": "/"},
            {"key": "director_disagree_tick",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK, "page": 2,
             "conditional": "approval_status", "match_value": "rejected", "text_override": "/"},

            {"key": "director_date",   "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_RED, "page": 2},
            {"key": "director_comments", "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_RED, "page": 2},
        ],
    },

    # ─────────────────────────────────────────────────────────────────────
    # AKD-03  Borang Rayuan Semakan Semula Keputusan Peperiksaan
    # Page 1 → student section  |  Page 2 → academic unit official use
    # ─────────────────────────────────────────────────────────────────────
    "AKD-03": {
        "pdf_file": "AKD-03.pdf",
        "pages": 2,
        "fields": [
            # ── PAGE 1 ────────────────────────────────────────────────
            {"key": "student_no",    "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "programme",     "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "student_name",  "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "receipt_no",    "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "receipt_date",  "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "amount_paid",   "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "faculty",       "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "phone_no",      "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "semester",      "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
            {"key": "session",       "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},

            # Course table – row 1  (repeat rows 2–5 as needed)
            {"key": "course_row_1_no",             "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_1_code",           "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_1_name",           "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_1_grade",          "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_1_lecturer",       "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_1_offering_centre","x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            # Row 2
            {"key": "course_row_2_no",             "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_2_code",           "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_2_name",           "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_2_grade",          "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_2_lecturer",       "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},
            {"key": "course_row_2_offering_centre","x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE, "page": 1},

            {"key": "student_date",  "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE, "page": 1},
        ],
    },

    # ─────────────────────────────────────────────────────────────────────
    # AKD-04  Borang Tunjuk Sebab Tidak Hadir (Absence Justification)
    # Page 1 of 1
    # ─────────────────────────────────────────────────────────────────────
    "AKD-04": {
        "pdf_file": "AKD-04.pdf",
        "pages": 1,
        "fields": [
            # ── BAHAGIAN A ────────────────────────────────────────────
            {"key": "student_name",  "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "student_no",    "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "programme",     "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "phone_no",      "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "address",       "x": 0, "y": 0, "fs": FS_SMALL,  "color": INK_BLUE},

            # ── BUTIRAN PERMOHONAN ────────────────────────────────────
            {"key": "reason_text",   "x": 0, "y": 0, "fs": FS_SMALL,  "color": INK_BLUE},

            # Course table – row 1
            {"key": "course_row_1_code",       "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE},
            {"key": "course_row_1_name",       "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE},
            # Class type ticks (per row – only one fires)
            {"key": "course_row_1_tick_kuliah",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "course_row_1_class_type", "match_value": "kuliah", "text_override": "/"},
            {"key": "course_row_1_tick_tutorial",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "course_row_1_class_type", "match_value": "tutorial", "text_override": "/"},
            {"key": "course_row_1_tick_amali",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "course_row_1_class_type", "match_value": "amali", "text_override": "/"},
            # Row 2
            {"key": "course_row_2_code",       "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE},
            {"key": "course_row_2_name",       "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_BLUE},
            {"key": "course_row_2_tick_kuliah",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "course_row_2_class_type", "match_value": "kuliah", "text_override": "/"},
            {"key": "course_row_2_tick_tutorial",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "course_row_2_class_type", "match_value": "tutorial", "text_override": "/"},
            {"key": "course_row_2_tick_amali",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "course_row_2_class_type", "match_value": "amali", "text_override": "/"},

            {"key": "date_of_absence",  "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "student_date",     "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},

            # ── UNTUK KEGUNAAN PEJABAT ────────────────────────────────
            {"key": "director_comments", "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_RED},
            {"key": "director_approved_tick",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "approval_status", "match_value": "fully_approved", "text_override": "/"},
            {"key": "director_not_approved_tick",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "approval_status", "match_value": "rejected", "text_override": "/"},
            {"key": "director_date",  "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_RED},
        ],
    },

    # ─────────────────────────────────────────────────────────────────────
    # AKD-05  Borang Tempahan Bilik Kuliah/Tutorial (Room Booking)
    # Page 1 of 1
    # ─────────────────────────────────────────────────────────────────────
    "AKD-05": {
        "pdf_file": "AKD-05.pdf",
        "pages": 1,
        "fields": [
            # ── BAHAGIAN A ────────────────────────────────────────────
            {"key": "applicant_name",  "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "position",        "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "phone_no",        "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},

            # ── Room selection ticks ───────────────────────────────────
            # Bilik Kuliah (BK) 1-4
            {"key": "tick_bk_1",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "room_choice", "match_value": "BK1", "text_override": "O"},
            {"key": "tick_bk_2",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "room_choice", "match_value": "BK2", "text_override": "O"},
            {"key": "tick_bk_3",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "room_choice", "match_value": "BK3", "text_override": "O"},
            {"key": "tick_bk_4",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "room_choice", "match_value": "BK4", "text_override": "O"},

            # Bilik Tutorial PPST Building (BT) 1-5
            {"key": "tick_bt_1",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "room_choice", "match_value": "BT1", "text_override": "O"},
            {"key": "tick_bt_2",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "room_choice", "match_value": "BT2", "text_override": "O"},
            {"key": "tick_bt_3",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "room_choice", "match_value": "BT3", "text_override": "O"},
            {"key": "tick_bt_4",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "room_choice", "match_value": "BT4", "text_override": "O"},
            {"key": "tick_bt_5",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "room_choice", "match_value": "BT5", "text_override": "O"},

            # Bilik Tutorial Annex Building (BT) 6-9
            {"key": "tick_bta_6",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "room_choice", "match_value": "BTA6", "text_override": "O"},
            {"key": "tick_bta_7",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "room_choice", "match_value": "BTA7", "text_override": "O"},
            {"key": "tick_bta_8",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "room_choice", "match_value": "BTA8", "text_override": "O"},
            {"key": "tick_bta_9",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "room_choice", "match_value": "BTA9", "text_override": "O"},

            {"key": "purpose",         "x": 0, "y": 0, "fs": FS_SMALL,  "color": INK_BLUE},
            {"key": "booking_date",    "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "student_date",    "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},

            # ── UNTUK KEGUNAAN PEJABAT ────────────────────────────────
            {"key": "director_comments", "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_RED},
            {"key": "director_approved_tick",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "approval_status", "match_value": "fully_approved", "text_override": "/"},
            {"key": "director_not_approved_tick",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "approval_status", "match_value": "rejected", "text_override": "/"},
            {"key": "director_date",  "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_RED},
        ],
    },

    # ─────────────────────────────────────────────────────────────────────
    # AKD-06  Borang Permohonan Cuti Sakit (Sick Leave)
    # Page 1 of 1
    # ─────────────────────────────────────────────────────────────────────
    "AKD-06": {
        "pdf_file": "AKD-06.pdf",
        "pages": 1,
        "fields": [
            # ── BAHAGIAN A ────────────────────────────────────────────
            {"key": "student_name",  "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "ic_number",     "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "matric_no",     "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},
            {"key": "phone_no",      "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},

            # Kumpulan ticks (class type)
            {"key": "tick_kuliah",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "class_group", "match_value": "kuliah",   "text_override": "/"},
            {"key": "tick_tutorial",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "class_group", "match_value": "tutorial", "text_override": "/"},
            {"key": "tick_amali",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "class_group", "match_value": "amali",    "text_override": "/"},

            # Facility ticks
            {"key": "tick_kerajaan",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "hospital_type", "match_value": "government", "text_override": "/"},
            {"key": "tick_swasta",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "hospital_type", "match_value": "private",    "text_override": "/"},

            {"key": "student_date",  "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_BLUE},

            # ── UNTUK KEGUNAAN PEJABAT ────────────────────────────────
            {"key": "director_comments", "x": 0, "y": 0, "fs": FS_SMALL, "color": INK_RED},
            {"key": "director_approved_tick",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "approval_status", "match_value": "fully_approved", "text_override": "/"},
            {"key": "director_not_approved_tick",
             "x": 0, "y": 0, "fs": FS_TICK, "color": INK_TICK,
             "conditional": "approval_status", "match_value": "rejected", "text_override": "/"},
            {"key": "director_date",  "x": 0, "y": 0, "fs": FS_NORMAL, "color": INK_RED},
        ],
    },
}

# Mapping from system form_type names → coordinate key above
FORM_TYPE_MAP = {
    "withdrawal":       "AKD-01",
    "exam_replacement": "AKD-02",
    "appeal_review":    "AKD-03",
    "non_sick_leave":   "AKD-04",
    "room_booking":     "AKD-05",
    "sick_leave":       "AKD-06",
}


# =============================================================================
# OVERLAY GENERATOR
# =============================================================================

def _make_overlay_page(fields_for_page, data, page_width=PAGE_W, page_height=PAGE_H):
    """
    Create a single-page transparent ReportLab PDF overlay.
    Returns bytes.
    """
    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(page_width, page_height))

    for field in fields_for_page:
        # --- conditional evaluation ---
        cond_key   = field.get("conditional")
        match_val  = field.get("match_value")
        if cond_key:
            actual = data.get(cond_key, "")
            if actual != match_val:
                continue

        # --- resolve text ---
        text_override = field.get("text_override")
        if text_override:
            text = text_override
        else:
            text = str(data.get(field["key"], "") or "")

        if not text:
            continue

        # --- draw ---
        c.setFillColor(field.get("color", black))
        c.setFont("Helvetica", field.get("fs", FS_NORMAL))
        c.drawString(field["x"], field["y"], text)

    c.save()
    buf.seek(0)
    return buf.read()


def generate_filled_pdf(form_key, data):
    """
    Build the filled PDF for `form_key` using `data`.
    Returns bytes of the final merged PDF.
    """
    config    = COORDS[form_key]
    pdf_path  = os.path.join(FORMS_DIR, config["pdf_file"])
    num_pages = config["pages"]

    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"Template not found: {pdf_path}")

    template_reader = pypdf.PdfReader(pdf_path)
    writer          = pypdf.PdfWriter()

    for page_idx in range(num_pages):
        template_page = template_reader.pages[page_idx]
        page_num      = page_idx + 1   # 1-based used in field defs

        # Collect fields for this page
        page_fields = [
            f for f in config["fields"]
            if f.get("page", 1) == page_num
        ]

        # Get actual page dimensions (may differ from A4)
        media_box = template_page.mediabox
        pw = float(media_box.width)
        ph = float(media_box.height)

        overlay_bytes = _make_overlay_page(page_fields, data, pw, ph)

        # Merge overlay onto template page
        overlay_reader = pypdf.PdfReader(io.BytesIO(overlay_bytes))
        overlay_page   = overlay_reader.pages[0]
        template_page.merge_page(overlay_page)
        writer.add_page(template_page)

    out = io.BytesIO()
    writer.write(out)
    out.seek(0)
    return out.read()


# =============================================================================
# CALIBRATION HELPER
# =============================================================================

def _generate_dot_grid(pdf_path, output_path, step=50):
    """
    Overlay a numbered dot grid on the template so you can read off
    coordinates by eye.  Run with:
        python3 pdf_filler.py --calibrate AKD-01
    Output: AKD-01_calibrate.pdf
    """
    reader = pypdf.PdfReader(pdf_path)
    writer = pypdf.PdfWriter()

    for page_idx, template_page in enumerate(reader.pages):
        media_box = template_page.mediabox
        pw = float(media_box.width)
        ph = float(media_box.height)

        buf = io.BytesIO()
        c = rl_canvas.Canvas(buf, pagesize=(pw, ph))
        c.setFillColor(HexColor("#cc0000"))
        c.setFont("Helvetica", 6)

        x = 0
        while x <= pw:
            y = 0
            while y <= ph:
                c.circle(x, y, 1.5, stroke=0, fill=1)
                c.drawString(x + 2, y + 2, f"{int(x)},{int(y)}")
                y += step
            x += step

        c.save()
        buf.seek(0)

        overlay_reader = pypdf.PdfReader(buf)
        template_page.merge_page(overlay_reader.pages[0])
        writer.add_page(template_page)

    with open(output_path, "wb") as fh:
        writer.write(fh)
    print(f"Calibration grid written → {output_path}", file=sys.stderr)


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    args = sys.argv[1:]

    # ── calibration mode ──────────────────────────────────────────────────
    if args and args[0] == "--calibrate":
        form_key = args[1] if len(args) > 1 else "AKD-01"
        config   = COORDS.get(form_key)
        if not config:
            print(f"Unknown form key: {form_key}", file=sys.stderr)
            sys.exit(1)
        pdf_path = os.path.join(FORMS_DIR, config["pdf_file"])
        out_path = os.path.join(FORMS_DIR, f"{form_key}_calibrate.pdf")
        _generate_dot_grid(pdf_path, out_path)
        sys.exit(0)

    # ── normal fill mode ──────────────────────────────────────────────────
    if not args:
        print("Usage: echo '<json>' | python3 pdf_filler.py <form_type>", file=sys.stderr)
        sys.exit(1)

    form_type = args[0]
    form_key  = FORM_TYPE_MAP.get(form_type)
    if not form_key:
        print(f"Unknown form_type: {form_type}", file=sys.stderr)
        sys.exit(1)

    try:
        raw  = sys.stdin.read()
        data = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        pdf_bytes = generate_filled_pdf(form_key, data)
        sys.stdout.buffer.write(pdf_bytes)
    except FileNotFoundError as e:
        print(str(e), file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
