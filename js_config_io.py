"""
js_config_io.py
----------------
Reads and writes backend/config/formCoordinates.js without needing a real
JS parser. The file has a very regular shape (a handful of `const XXXX = {
pdfFile, fields: [...] };` blocks plus a FORM_MAP), so this uses brace-depth
scanning + small regexes instead of pulling in a JS engine.

Kept dependency-free (no tkinter, no PyMuPDF) so it can be imported and
tested in isolation from the GUI.
"""

import re

FONT_SIZE_SYMBOLS = {10: "FONT_SIZE_NORMAL", 8.5: "FONT_SIZE_SMALL", 11: "TICK_SIZE"}

HEADER_TEXT = """// =============================================================
// config/formCoordinates.js
// (X, Y) coordinate maps for each PPST AKD form.
// Origin is bottom-left of A4 page (595 x 842 pts).
// All measurements are in PDF points (1 pt \u2248 0.352 mm).
// The original templates are kept in assets/BorangPPST. Fine-tune the
// coordinates below with a PDF ruler tool when a field needs adjustment.
// =============================================================

const FONT_SIZE_NORMAL = 10;
const FONT_SIZE_SMALL  = 8.5;
const TICK_SIZE        = 11;   // checkbox tick font size
"""

DASH = "\u2500" * 63

CONST_START_RE = re.compile(r"const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*\{")
PDF_FILE_RE = re.compile(r'pdfFile:\s*"([^"]*)"')
HEADER_RE = re.compile(
    r"//\s*[\u2500-]+\s*\r?\n"
    r"//\s*(?P<label>.+?)\s*\r?\n"
    r"//\s*[\u2500-]+\s*\r?\n"
    r"const\s+(?P<var>[A-Z0-9_]+)\s*="
)
FORM_MAP_RE = re.compile(r"const\s+FORM_MAP\s*=\s*\{(?P<body>.*?)\};", re.DOTALL)
ATTR_RE = re.compile(r'(\w+)\s*:\s*(".*?"|[-\w.]+)')


def new_model():
    return {"order": [], "forms": {}}


def to_number(s):
    s = str(s)
    return float(s) if "." in s else int(s)


def _matching_brace(text, open_idx, open_ch="{", close_ch="}"):
    """Given index of an opening brace/bracket, return index of its match."""
    depth = 0
    i = open_idx
    while i < len(text):
        if text[i] == open_ch:
            depth += 1
        elif text[i] == close_ch:
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise ValueError("unbalanced braces in formCoordinates.js")


def split_top_level_objects(s):
    """Split '{...}, {...}, ...' into a list of inner object texts."""
    objs = []
    depth = 0
    start = None
    for i, ch in enumerate(s):
        if ch == "{":
            if depth == 0:
                start = i + 1
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start is not None:
                objs.append(s[start:i])
                start = None
    return objs


def parse_field_obj(text):
    attrs = {}
    for m in ATTR_RE.finditer(text):
        k, v = m.group(1), m.group(2)
        if v.startswith('"') and v.endswith('"'):
            v = v[1:-1]
        attrs[k] = v
    field = {
        "key": attrs.get("key", ""),
        "x": to_number(attrs.get("x", "0")),
        "y": to_number(attrs.get("y", "0")),
        "fontSize": attrs.get("fontSize", "FONT_SIZE_NORMAL"),
    }
    if "conditional" in attrs:
        field["conditional"] = attrs["conditional"]
        field["matchValue"] = attrs.get("matchValue", "")
    return field


def find_const_blocks(text):
    """Return list of (varName, bodyText) for every `const NAME = { ... };`
    block except FORM_MAP."""
    blocks = []
    for m in CONST_START_RE.finditer(text):
        name = m.group(1)
        if name == "FORM_MAP":
            continue
        open_idx = m.end() - 1
        close_idx = _matching_brace(text, open_idx)
        blocks.append((name, text[open_idx + 1:close_idx]))
    return blocks


def parse_form_block(body):
    pdf_match = PDF_FILE_RE.search(body)
    pdf_file = pdf_match.group(1) if pdf_match else ""
    fields = []
    idx = body.find("fields:")
    if idx != -1:
        bracket_idx = body.find("[", idx)
        if bracket_idx != -1:
            close_idx = _matching_brace(body, bracket_idx, "[", "]")
            inner = body[bracket_idx + 1:close_idx]
            for obj_text in split_top_level_objects(inner):
                fields.append(parse_field_obj(obj_text))
    return {"pdfFile": pdf_file, "fields": fields}


def parse_form_map(text):
    """Return ordered list of (form_type_key, var_name)."""
    m = FORM_MAP_RE.search(text)
    mapping = []
    if not m:
        return mapping
    for line in m.group("body").splitlines():
        line = line.strip().rstrip(",")
        if not line or line.startswith("//") or ":" not in line:
            continue
        k, v = line.split(":", 1)
        mapping.append((k.strip(), v.strip()))
    return mapping


def parse_js(text):
    model = new_model()
    headers = {m.group("var"): m.group("label") for m in HEADER_RE.finditer(text)}
    var_to_data = {}
    for name, body in find_const_blocks(text):
        parsed = parse_form_block(body)
        parsed["label"] = headers.get(name, name)
        var_to_data[name] = parsed

    mapping = parse_form_map(text)
    for form_type, var_name in mapping:
        data = var_to_data.get(var_name, {"pdfFile": "", "fields": [], "label": var_name})
        model["forms"][form_type] = {
            "varName": var_name,
            "label": data["label"],
            "pdfFile": data["pdfFile"],
            "fields": data["fields"],
        }
        model["order"].append(form_type)
    return model


def format_number(n):
    if isinstance(n, str):
        n = to_number(n)
    if isinstance(n, float) and n.is_integer():
        return str(int(n))
    return str(n)


def format_fontsize(v):
    if isinstance(v, (int, float)):
        for num, sym in FONT_SIZE_SYMBOLS.items():
            if abs(v - num) < 1e-9:
                return sym
        return format_number(v)
    s = str(v)
    if re.match(r"^-?\d+(\.\d+)?$", s):
        return format_fontsize(float(s))
    return s  # already a symbolic constant name (or a custom const)


def format_field(f):
    parts = [
        'key: "{}"'.format(f["key"]),
        "x: {}".format(format_number(f["x"])),
        "y: {}".format(format_number(f["y"])),
        "fontSize: {}".format(format_fontsize(f["fontSize"])),
    ]
    if f.get("conditional"):
        parts.append('conditional: "{}"'.format(f["conditional"]))
        parts.append('matchValue: "{}"'.format(f.get("matchValue", "")))
    return "    { " + ", ".join(parts) + " },"


def format_form_block(data):
    lines = [
        "// " + DASH,
        "// {}".format(data.get("label", data["varName"])),
        "// " + DASH,
        "const {} = {{".format(data["varName"]),
        '  pdfFile: "{}",'.format(data["pdfFile"]),
        "  fields: [",
    ]
    for f in data["fields"]:
        lines.append(format_field(f))
    lines.append("  ],")
    lines.append("};")
    return "\n".join(lines)


def generate_js(model):
    out = [HEADER_TEXT.rstrip("\n")]
    for form_type in model["order"]:
        out.append("")
        out.append(format_form_block(model["forms"][form_type]))
    out.append("")
    out.append("// " + DASH)
    out.append("// Map form_type strings \u2192 coordinate config")
    out.append("// " + DASH)
    out.append("const FORM_MAP = {")
    for form_type in model["order"]:
        out.append("  {}: {},".format(form_type, model["forms"][form_type]["varName"]))
    out.append("};")
    out.append("")
    out.append("module.exports = { FORM_MAP };")
    out.append("")
    return "\n".join(out)
