// =============================================================
// backend/pdf_filler.js
// Pure Node.js PDF filler using pdf-lib.
// Replaces pdf_filler.py for Vercel serverless deployment.
//
// Usage: node backend/pdf_filler.js <form_type> <json_data>
//   e.g. node backend/pdf_filler.js withdrawal '{"student_name":"Ali"}'
// Output: Raw PDF bytes to stdout
// =============================================================
const path = require("path");
const fs = require("fs");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

const FORMS_DIR = path.join(__dirname, "assets", "forms");
const formCoordinates = require("./config/formCoordinates");

// Map form_type strings → coordinate form_key
const FORM_TYPE_MAP = {
  withdrawal:       "withdrawal",
  exam_replacement: "exam_replacement",
  appeal_review:    "appeal_review",
  non_sick_leave:   "non_sick_leave",
  room_booking:     "room_booking",
  sick_leave:       "sick_leave",
};

// Ink color presets
const INK_BLUE  = rgb(0.051, 0.102, 0.251);   // #0d1a40
const INK_RED   = rgb(0.545, 0.0, 0.0);        // #8b0000
const INK_TICK  = rgb(0.0, 0.373, 0.0);        // #005f00

const FONT_SIZE_NORMAL = 10;
const FONT_SIZE_SMALL  = 8.5;
const FONT_TICK        = 12;

async function fillPdf(formKey, data) {
  const config = formCoordinates.FORM_MAP[formKey];
  if (!config) throw new Error(`Unknown form: ${formKey}`);

  const pdfPath = path.join(FORMS_DIR, config.pdfFile);
  if (!fs.existsSync(pdfPath)) throw new Error(`Template not found: ${pdfPath}`);

  const bytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(bytes);
  const pages = pdfDoc.getPages();
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < config.fields.length; i++) {
    const field = config.fields[i];

    // Conditional check
    if (field.conditional) {
      if (data[field.conditional] !== field.matchValue) continue;
    }

    // Resolve text value
    const text = data[field.key];
    if (!text && text !== 0) continue;
    const textStr = String(text);
    if (!textStr.trim()) continue;

    // Find matching page
    const pageIndex = field.page ? field.page - 1 : 0;
    const page = pages[pageIndex];
    if (!page) continue;

    // Determine font size and color
    const fontSize = field.fontSize || FONT_SIZE_NORMAL;
    let color = INK_BLUE;
    if (field.color === "red") color = INK_RED;
    else if (field.color === "tick") color = INK_TICK;

    // Scale font if it's a tick type (check for tick-related keys)
    const isTick = field.key && field.key.includes("tick_");
    const finalSize = isTick ? FONT_TICK : fontSize;

    // Draw text at exact coordinates
    page.drawText(textStr, {
      x: field.x,
      y: field.y,
      size: finalSize,
      font: helv,
      color: color,
    });
  }

  return await pdfDoc.save();
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node pdf_filler.js <form_type> <json_data>");
    process.exit(1);
  }

  const formType = args[0];
  const formKey = FORM_TYPE_MAP[formType];
  if (!formKey) {
    console.error(`Unknown form_type: ${formType}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(args[1]);
  } catch (e) {
    console.error(`JSON parse error: ${e.message}`);
    process.exit(1);
  }

  try {
    const pdfBytes = await fillPdf(formKey, data);
    process.stdout.write(Buffer.from(pdfBytes));
  } catch (err) {
    console.error(`PDF fill error: ${err.message}`, process.stderr);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fillPdf };
