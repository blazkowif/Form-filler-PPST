#!/usr/bin/env python3
"""
PPST Form Field Coordinate Mapper
==================================
A local GUI tool that replaces manually measuring PDF coordinates with a
PDF ruler: you pick a form, describe a field, drag a box on the rendered
PDF where it should print, and the tool writes the (x, y) straight into
backend/config/formCoordinates.js.

Install:
    pip install PyMuPDF pillow

Run:
    python pdf_field_mapper.py

On first run, use "Open formCoordinates.js..." to point it at your file,
and "Set PDF folder..." to point it at the folder holding the templates
(assets/BorangPPST). After that it remembers both for the session and
will try to auto-find them next time based on your file's location.
"""

import os
import shutil
import datetime
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

import js_config_io as jc

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    from PIL import Image, ImageTk
except ImportError:
    Image = None
    ImageTk = None

MARKER_COLOR = "#1d7fd6"
COND_COLOR = "#e63946"
BOX_COLOR = "#2a9d8f"

FONT_CHOICES = [
    "FONT_SIZE_NORMAL (10)",
    "FONT_SIZE_SMALL (8.5)",
    "TICK_SIZE (11)",
    "Custom...",
]


def fontsize_to_choice(value):
    s = jc.format_fontsize(value)
    for choice in FONT_CHOICES[:-1]:
        if choice.startswith(s):
            return choice, ""
    return "Custom...", str(value)


class FieldDialog(tk.Toplevel):
    """Modal dialog for a field's metadata (everything except x/y, which
    is set afterwards by dragging a box on the canvas)."""

    def __init__(self, parent, existing=None, existing_keys=()):
        super().__init__(parent)
        self.title("Edit field" if existing else "New field")
        self.resizable(False, False)
        self.result = None
        self.existing_keys = set(existing_keys)
        self.editing_key = existing["key"] if existing else None

        pad = {"padx": 8, "pady": 4}

        row = 0
        tk.Label(self, text="Field key (variable name):").grid(row=row, column=0, sticky="w", **pad)
        self.key_var = tk.StringVar(value=existing["key"] if existing else "")
        tk.Entry(self, textvariable=self.key_var, width=32).grid(row=row, column=1, columnspan=2, sticky="we", **pad)

        row += 1
        tk.Label(self, text="Font size:").grid(row=row, column=0, sticky="w", **pad)
        default_choice, default_custom = ("FONT_SIZE_NORMAL (10)", "")
        if existing:
            default_choice, default_custom = fontsize_to_choice(existing["fontSize"])
        self.fontsize_var = tk.StringVar(value=default_choice)
        combo = ttk.Combobox(self, textvariable=self.fontsize_var, values=FONT_CHOICES, state="readonly", width=20)
        combo.grid(row=row, column=1, sticky="w", **pad)
        self.custom_size_var = tk.StringVar(value=default_custom)
        self.custom_entry = tk.Entry(self, textvariable=self.custom_size_var, width=8)
        self.custom_entry.grid(row=row, column=2, sticky="w", **pad)
        combo.bind("<<ComboboxSelected>>", lambda e: self._sync_custom_state())
        self._sync_custom_state()

        row += 1
        ttk.Separator(self, orient="horizontal").grid(row=row, column=0, columnspan=3, sticky="we", pady=6)

        row += 1
        tk.Label(self, text="Checkbox condition (optional):", font=("TkDefaultFont", 9, "italic")).grid(
            row=row, column=0, columnspan=3, sticky="w", padx=8
        )

        row += 1
        tk.Label(self, text="  conditional field name:").grid(row=row, column=0, sticky="w", **pad)
        self.cond_var = tk.StringVar(value=existing.get("conditional", "") if existing else "")
        tk.Entry(self, textvariable=self.cond_var, width=32).grid(row=row, column=1, columnspan=2, sticky="we", **pad)

        row += 1
        tk.Label(self, text="  matches value:").grid(row=row, column=0, sticky="w", **pad)
        self.match_var = tk.StringVar(value=existing.get("matchValue", "") if existing else "")
        tk.Entry(self, textvariable=self.match_var, width=32).grid(row=row, column=1, columnspan=2, sticky="we", **pad)

        row += 1
        btns = tk.Frame(self)
        btns.grid(row=row, column=0, columnspan=3, pady=10)
        tk.Button(btns, text="Cancel", width=10, command=self.destroy).pack(side="left", padx=6)
        tk.Button(btns, text="OK", width=10, command=self._on_ok, default="active").pack(side="left", padx=6)

        self.bind("<Return>", lambda e: self._on_ok())
        self.transient(parent)
        self.grab_set()
        self.wait_window(self)

    def _sync_custom_state(self):
        if self.fontsize_var.get() == "Custom...":
            self.custom_entry.config(state="normal")
        else:
            self.custom_entry.config(state="disabled")

    def _on_ok(self):
        key = self.key_var.get().strip()
        if not key:
            messagebox.showerror("Missing key", "Please enter a field key.", parent=self)
            return
        if key != self.editing_key and key in self.existing_keys:
            messagebox.showerror("Duplicate key", f"A field named '{key}' already exists on this form.", parent=self)
            return

        choice = self.fontsize_var.get()
        if choice.startswith("FONT_SIZE_NORMAL"):
            font_size = "FONT_SIZE_NORMAL"
        elif choice.startswith("FONT_SIZE_SMALL"):
            font_size = "FONT_SIZE_SMALL"
        elif choice.startswith("TICK_SIZE"):
            font_size = "TICK_SIZE"
        else:
            raw = self.custom_size_var.get().strip()
            try:
                font_size = float(raw)
                if font_size.is_integer():
                    font_size = int(font_size)
            except ValueError:
                messagebox.showerror("Invalid size", "Enter a numeric custom font size.", parent=self)
                return

        cond = self.cond_var.get().strip()
        match = self.match_var.get().strip()
        if cond and not match:
            messagebox.showerror("Missing match value", "You set a condition but no match value.", parent=self)
            return

        result = {"key": key, "fontSize": font_size}
        if cond:
            result["conditional"] = cond
            result["matchValue"] = match
        self.result = result
        self.destroy()


class NewFormDialog(tk.Toplevel):
    """Modal dialog for adding a brand-new form_type entry to FORM_MAP."""

    def __init__(self, parent, existing_types=(), existing_vars=()):
        super().__init__(parent)
        self.title("New form")
        self.resizable(False, False)
        self.result = None
        self.existing_types = set(existing_types)
        self.existing_vars = set(existing_vars)

        pad = {"padx": 8, "pady": 4}
        tk.Label(self, text="Form type key (used in FORM_MAP, e.g. medical_leave):").grid(
            row=0, column=0, columnspan=2, sticky="w", **pad
        )
        self.type_var = tk.StringVar()
        tk.Entry(self, textvariable=self.type_var, width=34).grid(row=1, column=0, columnspan=2, sticky="we", **pad)

        tk.Label(self, text="Variable name (e.g. AKD07):").grid(row=2, column=0, columnspan=2, sticky="w", **pad)
        self.var_var = tk.StringVar()
        tk.Entry(self, textvariable=self.var_var, width=34).grid(row=3, column=0, columnspan=2, sticky="we", **pad)

        tk.Label(self, text="Label / comment (e.g. AKD-07 \u2014 Medical Leave):").grid(
            row=4, column=0, columnspan=2, sticky="w", **pad
        )
        self.label_var = tk.StringVar()
        tk.Entry(self, textvariable=self.label_var, width=34).grid(row=5, column=0, columnspan=2, sticky="we", **pad)

        tk.Label(self, text="PDF template filename:").grid(row=6, column=0, sticky="w", **pad)
        self.pdf_var = tk.StringVar()
        tk.Entry(self, textvariable=self.pdf_var, width=26).grid(row=7, column=0, sticky="we", **pad)
        tk.Button(self, text="Browse...", command=self._browse_pdf).grid(row=7, column=1, sticky="w", **pad)

        btns = tk.Frame(self)
        btns.grid(row=8, column=0, columnspan=2, pady=10)
        tk.Button(btns, text="Cancel", width=10, command=self.destroy).pack(side="left", padx=6)
        tk.Button(btns, text="OK", width=10, command=self._on_ok).pack(side="left", padx=6)

        self.transient(parent)
        self.grab_set()
        self.wait_window(self)

    def _browse_pdf(self):
        path = filedialog.askopenfilename(title="Select PDF template", filetypes=[("PDF files", "*.pdf")])
        if path:
            self.pdf_var.set(os.path.basename(path))
            self._browsed_full_path = path

    def _on_ok(self):
        ftype = self.type_var.get().strip()
        var = self.var_var.get().strip().upper()
        label = self.label_var.get().strip() or f"{var} \u2014 {ftype}"
        pdf_file = self.pdf_var.get().strip()
        if not ftype or not var or not pdf_file:
            messagebox.showerror("Missing info", "Form type key, variable name, and PDF filename are all required.", parent=self)
            return
        if ftype in self.existing_types:
            messagebox.showerror("Duplicate", f"Form type '{ftype}' already exists.", parent=self)
            return
        if var in self.existing_vars:
            messagebox.showerror("Duplicate", f"Variable name '{var}' already exists.", parent=self)
            return
        self.result = {"formType": ftype, "varName": var, "label": label, "pdfFile": pdf_file}
        self.destroy()


class FieldMapperApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("PPST Form Field Coordinate Mapper")
        self.geometry("1250x850")

        self.config_path = None
        self.assets_dir = None
        self.model = jc.new_model()
        self.current_form_type = None

        self.pdf_doc = None
        self.pdf_page = None
        self.zoom = 1.3
        self.page_w_pt = 595.0
        self.page_h_pt = 842.0
        self.tk_img = None
        self.tk_page_images = []

        self.pending_mode = None          # None | "add" | "reposition"
        self.pending_field_meta = None
        self.pending_reposition_key = None
        self.rect_id = None
        self.rect_start = None

        self.status = tk.StringVar(value="Open your formCoordinates.js to get started.")
        self.coord_text = tk.StringVar(value="PDF coords: -")

        self._build_ui()
        self._try_auto_load()

    # ------------------------------------------------------------------
    # UI construction
    # ------------------------------------------------------------------
    def _build_ui(self):
        toolbar = tk.Frame(self)
        toolbar.pack(side="top", fill="x", padx=6, pady=4)

        tk.Button(toolbar, text="Open formCoordinates.js...", command=self.browse_js).pack(side="left", padx=3)
        tk.Button(toolbar, text="Set PDF folder...", command=self.browse_assets).pack(side="left", padx=3)

        tk.Label(toolbar, text="  Form:").pack(side="left", padx=(12, 2))
        self.form_combo = ttk.Combobox(toolbar, state="readonly", width=22)
        self.form_combo.pack(side="left")
        self.form_combo.bind("<<ComboboxSelected>>", lambda e: self.select_form(self.form_combo.get()))

        tk.Button(toolbar, text="+ New Form", command=self.new_form).pack(side="left", padx=6)

        tk.Button(toolbar, text="Zoom -", command=lambda: self.change_zoom(-0.2)).pack(side="left", padx=(20, 2))
        tk.Button(toolbar, text="Zoom +", command=lambda: self.change_zoom(0.2)).pack(side="left", padx=2)

        save_btn = tk.Button(toolbar, text="Save to formCoordinates.js", command=self.save, bg="#2a9d8f", fg="white")
        save_btn.pack(side="right", padx=3)

        main = tk.PanedWindow(self, orient="horizontal", sashwidth=6)
        main.pack(side="top", fill="both", expand=True)

        # --- canvas area ---
        canvas_frame = tk.Frame(main)
        self.canvas = tk.Canvas(canvas_frame, bg="#dddddd", cursor="crosshair")
        hbar = tk.Scrollbar(canvas_frame, orient="horizontal", command=self.canvas.xview)
        vbar = tk.Scrollbar(canvas_frame, orient="vertical", command=self.canvas.yview)
        self.canvas.config(xscrollcommand=hbar.set, yscrollcommand=vbar.set)
        self.canvas.grid(row=0, column=0, sticky="nsew")
        vbar.grid(row=0, column=1, sticky="ns")
        hbar.grid(row=1, column=0, sticky="we")
        canvas_frame.rowconfigure(0, weight=1)
        canvas_frame.columnconfigure(0, weight=1)
        main.add(canvas_frame, stretch="always")

        self.canvas.bind("<ButtonPress-1>", self.on_canvas_press)
        self.canvas.bind("<B1-Motion>", self.on_canvas_drag)
        self.canvas.bind("<ButtonRelease-1>", self.on_canvas_release)
        self.canvas.bind("<Motion>", self.on_canvas_motion)

        # --- sidebar ---
        sidebar = tk.Frame(main, width=340)
        main.add(sidebar)

        tk.Label(sidebar, text="Fields on this form", font=("TkDefaultFont", 10, "bold")).pack(anchor="w", padx=6, pady=(6, 2))

        cols = ("key", "x", "y", "font", "cond")
        self.tree = ttk.Treeview(sidebar, columns=cols, show="headings", height=22, selectmode="browse")
        for c, w in zip(cols, (120, 45, 45, 90, 90)):
            self.tree.heading(c, text=c)
            self.tree.column(c, width=w, anchor="w")
        self.tree.pack(fill="both", expand=True, padx=6)
        self.tree.bind("<<TreeviewSelect>>", lambda e: self._highlight_selected())

        btn_frame = tk.Frame(sidebar)
        btn_frame.pack(fill="x", padx=6, pady=6)
        tk.Button(btn_frame, text="Add Field", command=self.add_field).grid(row=0, column=0, sticky="we", padx=2, pady=2)
        tk.Button(btn_frame, text="Reposition", command=self.reposition_field).grid(row=0, column=1, sticky="we", padx=2, pady=2)
        tk.Button(btn_frame, text="Edit Info", command=self.edit_field_info).grid(row=1, column=0, sticky="we", padx=2, pady=2)
        tk.Button(btn_frame, text="Delete", command=self.delete_field).grid(row=1, column=1, sticky="we", padx=2, pady=2)
        btn_frame.columnconfigure(0, weight=1)
        btn_frame.columnconfigure(1, weight=1)

        legend = tk.Label(
            sidebar,
            justify="left",
            fg="#555555",
            text=(f"\u25CF blue = text field\n\u25CF red = checkbox / tick\n\n"
                  "Workflow:\n1. Add Field \u2192 fill details\n2. Drag a box on the PDF\n"
                  "   for where it should print\n3. Save when done"),
        )
        legend.pack(anchor="w", padx=6, pady=10)

        status_bar = tk.Frame(self)
        status_bar.pack(side="bottom", fill="x")
        tk.Label(status_bar, textvariable=self.status, anchor="w", relief="sunken").pack(side="left", fill="x", expand=True)
        tk.Label(status_bar, textvariable=self.coord_text, anchor="e", relief="sunken", width=28).pack(side="right")

    # ------------------------------------------------------------------
    # Loading files
    # ------------------------------------------------------------------
    def _try_auto_load(self):
        candidates = [
            os.path.join("backend", "config", "formCoordinates.js"),
            os.path.join("config", "formCoordinates.js"),
            "formCoordinates.js",
        ]
        for c in candidates:
            if os.path.isfile(c):
                self.load_js(os.path.abspath(c))
                return
        self.status.set("No formCoordinates.js found nearby \u2014 use 'Open formCoordinates.js...' above.")

    def browse_js(self):
        path = filedialog.askopenfilename(title="Select formCoordinates.js", filetypes=[("JavaScript files", "*.js")])
        if path:
            self.load_js(path)

    def load_js(self, path):
        try:
            text = open(path, encoding="utf-8").read()
            self.model = jc.parse_js(text)
        except Exception as e:
            messagebox.showerror("Could not read file", str(e))
            return
        self.config_path = path
        guess = os.path.normpath(os.path.join(os.path.dirname(path), "..", "assets", "BorangPPST"))
        if os.path.isdir(guess):
            self.assets_dir = guess
        self.form_combo["values"] = self.model["order"]
        if self.model["order"]:
            self.select_form(self.model["order"][0])
        self.status.set(f"Loaded {path} ({len(self.model['order'])} forms).")

    def browse_assets(self):
        d = filedialog.askdirectory(title="Select folder containing the PDF templates (assets/BorangPPST)")
        if d:
            self.assets_dir = d
            if self.current_form_type:
                self.load_pdf_for(self.model["forms"][self.current_form_type]["pdfFile"])

    # ------------------------------------------------------------------
    # Form / PDF handling
    # ------------------------------------------------------------------
    def select_form(self, form_type):
        if not form_type or form_type not in self.model["forms"]:
            return
        self.current_form_type = form_type
        self.form_combo.set(form_type)
        self.load_pdf_for(self.model["forms"][form_type]["pdfFile"])
        self._refresh_field_list()

    def load_pdf_for(self, pdf_filename):
        if fitz is None or Image is None:
            messagebox.showerror(
                "Missing dependency",
                "Please install the required packages first:\n\n    pip install PyMuPDF pillow",
            )
            return
        path = None
        if self.assets_dir:
            candidate = os.path.join(self.assets_dir, pdf_filename)
            if os.path.isfile(candidate):
                path = candidate
        if not path:
            path = filedialog.askopenfilename(
                title=f"Locate template: {pdf_filename}", filetypes=[("PDF files", "*.pdf")]
            )
            if not path:
                self.status.set(f"No PDF loaded for this form ({pdf_filename} not found).")
                self.canvas.delete("all")
                self.pdf_page = None
                return
            if not self.assets_dir:
                self.assets_dir = os.path.dirname(path)
        try:
            self.pdf_doc = fitz.open(path)
            self.pdf_page = self.pdf_doc[0]
            self.page_w_pt = self.pdf_page.rect.width
            self.page_h_pt = self.pdf_page.rect.height
        except Exception as e:
            messagebox.showerror("Could not open PDF", str(e))
            return
        self.render_page()

    def change_zoom(self, delta):
        self.zoom = max(0.5, min(3.0, self.zoom + delta))
        self.render_page()

    def render_page(self):
        if not self.pdf_doc:
            return
        self.canvas.delete("all")
        self.tk_page_images = []

        mat = fitz.Matrix(self.zoom, self.zoom)
        y_offset = 0
        max_width = 0
        page_gap = 24
        for page_number, page in enumerate(self.pdf_doc):
            pix = page.get_pixmap(matrix=mat)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            tk_img = ImageTk.PhotoImage(img)
            self.tk_page_images.append(tk_img)
            self.canvas.create_image(0, y_offset, anchor="nw", image=tk_img, tags=("page", f"page-{page_number + 1}"))
            self.canvas.create_text(
                8, y_offset + 8, anchor="nw", text=f"Page {page_number + 1}",
                fill="#555555", font=("TkDefaultFont", 9, "bold"), tags=("page-label",),
            )
            y_offset += pix.height + page_gap
            max_width = max(max_width, pix.width)

        self.canvas.config(scrollregion=(0, 0, max_width, max(0, y_offset - page_gap)))
        self._draw_overlays()

    # ------------------------------------------------------------------
    # Coordinate conversion  (PDF origin = bottom-left, canvas = top-left)
    # ------------------------------------------------------------------
    def pdf_to_canvas(self, x, y):
        return x * self.zoom, (self.page_h_pt - y) * self.zoom

    def canvas_to_pdf(self, cx, cy):
        return cx / self.zoom, self.page_h_pt - (cy / self.zoom)

    # ------------------------------------------------------------------
    # Overlays + field list
    # ------------------------------------------------------------------
    def _draw_overlays(self):
        self.canvas.delete("marker")
        if not self.current_form_type:
            return
        selected = self.tree.selection()
        selected_key = selected[0] if selected else None
        for f in self.model["forms"][self.current_form_type]["fields"]:
            cx, cy = self.pdf_to_canvas(f["x"], f["y"])
            color = COND_COLOR if f.get("conditional") else MARKER_COLOR
            width = 3 if f["key"] == selected_key else 2
            r = 5 if f["key"] == selected_key else 4
            self.canvas.create_oval(cx - r, cy - r, cx + r, cy + r, outline=color, width=width, tags=("marker",))
            self.canvas.create_text(
                cx + 6, cy - 6, text=f["key"], anchor="sw", fill=color,
                font=("TkDefaultFont", 8, "bold" if f["key"] == selected_key else "normal"),
                tags=("marker",),
            )

    def _refresh_field_list(self):
        self.tree.delete(*self.tree.get_children())
        if not self.current_form_type:
            return
        for f in self.model["forms"][self.current_form_type]["fields"]:
            cond = f'{f["conditional"]}={f.get("matchValue", "")}' if f.get("conditional") else ""
            self.tree.insert("", "end", iid=f["key"], values=(f["key"], f["x"], f["y"], jc.format_fontsize(f["fontSize"]), cond))
        self._draw_overlays()

    def _highlight_selected(self):
        self._draw_overlays()

    def _current_fields(self):
        return self.model["forms"][self.current_form_type]["fields"]

    # ------------------------------------------------------------------
    # Mouse interaction
    # ------------------------------------------------------------------
    def on_canvas_press(self, event):
        cx, cy = self.canvas.canvasx(event.x), self.canvas.canvasy(event.y)
        self.rect_start = (cx, cy)
        self.rect_id = self.canvas.create_rectangle(cx, cy, cx, cy, outline=BOX_COLOR, width=2, dash=(4, 2))

    def on_canvas_drag(self, event):
        if self.rect_id is None:
            return
        cx, cy = self.canvas.canvasx(event.x), self.canvas.canvasy(event.y)
        x0, y0 = self.rect_start
        self.canvas.coords(self.rect_id, x0, y0, cx, cy)

    def on_canvas_release(self, event):
        if self.rect_id is None:
            return
        cx, cy = self.canvas.canvasx(event.x), self.canvas.canvasy(event.y)
        x0, y0 = self.rect_start
        left, _right = sorted((x0, cx))
        _top, bottom = sorted((y0, cy))
        self.canvas.delete(self.rect_id)
        self.rect_id = None

        if not self.current_form_type:
            self.status.set("Select or create a form first.")
            return

        pdf_x, pdf_y = self.canvas_to_pdf(left, bottom)
        pdf_x, pdf_y = round(pdf_x, 1), round(pdf_y, 1)

        if self.pending_mode == "add" and self.pending_field_meta:
            field = dict(self.pending_field_meta)
            field["x"], field["y"] = pdf_x, pdf_y
            self._current_fields().append(field)
            self.status.set(f"Added '{field['key']}' at ({pdf_x}, {pdf_y}).")
            self.pending_mode = None
            self.pending_field_meta = None
            self._refresh_field_list()
        elif self.pending_mode == "reposition" and self.pending_reposition_key:
            for f in self._current_fields():
                if f["key"] == self.pending_reposition_key:
                    f["x"], f["y"] = pdf_x, pdf_y
                    break
            self.status.set(f"Moved '{self.pending_reposition_key}' to ({pdf_x}, {pdf_y}).")
            self.pending_mode = None
            self.pending_reposition_key = None
            self._refresh_field_list()
        else:
            self.status.set(f"Box at PDF ({pdf_x}, {pdf_y}) \u2014 click 'Add Field' first to place a new field.")

    def on_canvas_motion(self, event):
        cx, cy = self.canvas.canvasx(event.x), self.canvas.canvasy(event.y)
        px, py = self.canvas_to_pdf(cx, cy)
        self.coord_text.set(f"PDF coords: ({px:.1f}, {py:.1f})")

    # ------------------------------------------------------------------
    # Field / form actions
    # ------------------------------------------------------------------
    def add_field(self):
        if not self.current_form_type:
            messagebox.showinfo("No form selected", "Select or create a form first.")
            return
        existing_keys = [f["key"] for f in self._current_fields()]
        dlg = FieldDialog(self, existing_keys=existing_keys)
        if dlg.result:
            self.pending_field_meta = dlg.result
            self.pending_mode = "add"
            self.status.set(f"Now drag a box on the PDF for '{dlg.result['key']}'...")

    def edit_field_info(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo("Nothing selected", "Select a field in the list first.")
            return
        key = sel[0]
        fields = self._current_fields()
        f = next((x for x in fields if x["key"] == key), None)
        if f is None:
            return
        existing_keys = [x["key"] for x in fields]
        dlg = FieldDialog(self, existing=f, existing_keys=existing_keys)
        if dlg.result:
            x, y = f["x"], f["y"]          # dialog doesn't touch position
            f.clear()
            f.update(dlg.result)
            f["x"], f["y"] = x, y
            self._refresh_field_list()

    def reposition_field(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo("Nothing selected", "Select a field in the list first.")
            return
        self.pending_reposition_key = sel[0]
        self.pending_mode = "reposition"
        self.status.set(f"Now drag a new box on the PDF for '{sel[0]}'...")

    def delete_field(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo("Nothing selected", "Select a field in the list first.")
            return
        key = sel[0]
        if messagebox.askyesno("Delete field", f"Delete field '{key}'?"):
            self.model["forms"][self.current_form_type]["fields"] = [
                f for f in self._current_fields() if f["key"] != key
            ]
            self._refresh_field_list()

    def new_form(self):
        existing_types = self.model["order"]
        existing_vars = [self.model["forms"][t]["varName"] for t in existing_types]
        dlg = NewFormDialog(self, existing_types=existing_types, existing_vars=existing_vars)
        if not dlg.result:
            return
        r = dlg.result
        self.model["order"].append(r["formType"])
        self.model["forms"][r["formType"]] = {
            "varName": r["varName"],
            "label": r["label"],
            "pdfFile": r["pdfFile"],
            "fields": [],
        }
        # if the dialog's browse button found a full path, offer to copy it into assets_dir
        full_path = getattr(dlg, "_browsed_full_path", None)
        if full_path and self.assets_dir:
            dest = os.path.join(self.assets_dir, r["pdfFile"])
            if not os.path.isfile(dest):
                try:
                    shutil.copy2(full_path, dest)
                except Exception:
                    pass
        self.form_combo["values"] = self.model["order"]
        self.select_form(r["formType"])

    # ------------------------------------------------------------------
    # Save
    # ------------------------------------------------------------------
    def save(self):
        if not self.model["order"]:
            messagebox.showinfo("Nothing to save", "Load or create a form first.")
            return
        if not self.config_path:
            path = filedialog.asksaveasfilename(
                title="Save formCoordinates.js", defaultextension=".js", initialfile="formCoordinates.js"
            )
            if not path:
                return
            self.config_path = path
        else:
            backup = self.config_path + "." + datetime.datetime.now().strftime("%Y%m%d%H%M%S") + ".bak"
            try:
                shutil.copy2(self.config_path, backup)
            except Exception:
                pass
        text = jc.generate_js(self.model)
        try:
            with open(self.config_path, "w", encoding="utf-8") as fh:
                fh.write(text)
        except Exception as e:
            messagebox.showerror("Could not save", str(e))
            return
        messagebox.showinfo("Saved", f"Saved to:\n{self.config_path}\n\n(a timestamped backup of the previous version was kept alongside it)")
        self.status.set(f"Saved {self.config_path}")


if __name__ == "__main__":
    if fitz is None or Image is None:
        print("Missing dependencies. Run:  pip install PyMuPDF pillow")
    app = FieldMapperApp()
    app.mainloop()
