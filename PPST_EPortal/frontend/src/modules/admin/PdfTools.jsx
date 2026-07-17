// =============================================================
// src/modules/admin/PdfTools.jsx
// Download centre for PDF calibration grids + templates
// =============================================================
import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./PdfTools.css";

const FORM_LABELS = {
  "AKD-01": "Permohonan Berhenti Pengajian",
  "AKD-02": "Peperiksaan Gantian / Ulangan",
  "AKD-03": "Rayuan Semakan Semula Keputusan",
  "AKD-04": "Tunjuk Sebab Tidak Hadir",
  "AKD-05": "Tempahan Bilik Kuliah / Tutorial",
  "AKD-06": "Permohonan Cuti Sakit",
};

const PdfTools = () => {
  const [files,    setFiles]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [dlStatus, setDlStatus] = useState({});

  useEffect(() => {
    api.get("/calibrate")
      .then((r) => setFiles(r.data.data))
      .catch(() => setError("Could not load file list."))
      .finally(() => setLoading(false));
  }, []);

  const download = async (url, filename, key) => {
    setDlStatus((s) => ({ ...s, [key]: "loading" }));
    try {
      const token = sessionStorage.getItem("ppst_token");
      const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Download failed");
      const blob  = await res.blob();
      const href  = URL.createObjectURL(blob);
      const a     = document.createElement("a");
      a.href      = href;
      a.download  = filename;
      a.click();
      URL.revokeObjectURL(href);
      setDlStatus((s) => ({ ...s, [key]: "done" }));
      setTimeout(() => setDlStatus((s) => ({ ...s, [key]: null })), 2500);
    } catch {
      setDlStatus((s) => ({ ...s, [key]: "error" }));
      setTimeout(() => setDlStatus((s) => ({ ...s, [key]: null })), 3000);
    }
  };

  const downloadZip = () =>
    download("/api/calibrate/zip", "PPST_Calibration_Grids.zip", "zip");

  if (loading) return <div className="pt-state"><div className="loading-spinner" /> Loading…</div>;
  if (error)   return <div className="pt-state error">{error}</div>;

  return (
    <div className="pt-page">
      {/* Header */}
      <div className="pt-header">
        <div>
          <h1 className="pt-title">PDF Coordinate Tools</h1>
          <p className="pt-subtitle">
            Download calibration grids to measure (x, y) coordinates for each form field,
            then update <code>backend/pdf_filler.py</code>.
          </p>
        </div>
        <button
          className={`pt-zip-btn ${dlStatus.zip === "loading" ? "loading" : ""}`}
          onClick={downloadZip}
          disabled={dlStatus.zip === "loading"}
        >
          {dlStatus.zip === "loading" ? (
            <><span className="btn-spinner" /> Zipping…</>
          ) : dlStatus.zip === "done" ? (
            "✓ Downloaded!"
          ) : (
            "⬇ Download All Grids (.zip)"
          )}
        </button>
      </div>

      {/* How-to guide */}
      <div className="pt-guide">
        <h3 className="pt-guide-title">How to calibrate coordinates</h3>
        <ol className="pt-guide-steps">
          <li>Download a calibration grid PDF below.</li>
          <li>Open it in any PDF viewer — you'll see a red dot every 50 points, labelled with its <code>(x, y)</code> coordinate.</li>
          <li>Find where each field (name, matric, ticks…) sits on the form and note the nearest dot coordinates.</li>
          <li>Open <code>backend/pdf_filler.py</code> and update the matching <code>"x"</code> and <code>"y"</code> values in the <code>COORDS</code> dictionary.</li>
          <li>Test by clicking <strong>Download PDF</strong> on any reviewed application.</li>
        </ol>
      </div>

      {/* Form cards */}
      <div className="pt-grid">
        {files.map((f) => (
          <div key={f.key} className={`pt-card ${!f.calibrate_ready ? "missing" : ""}`}>
            <div className="pt-card-top">
              <span className="pt-form-key">{f.key}</span>
              <span className={`pt-badge ${f.template_ready ? "ready" : "missing"}`}>
                {f.template_ready ? "Template ✓" : "Template missing"}
              </span>
            </div>
            <p className="pt-form-label">{FORM_LABELS[f.key]}</p>

            <div className="pt-actions">
              {/* Calibration grid */}
              <button
                className={`pt-dl-btn calibrate ${
                  dlStatus[`cal_${f.key}`] === "loading" ? "loading" :
                  dlStatus[`cal_${f.key}`] === "done"    ? "done"    :
                  dlStatus[`cal_${f.key}`] === "error"   ? "error"   : ""
                }`}
                disabled={!f.calibrate_ready || dlStatus[`cal_${f.key}`] === "loading"}
                onClick={() =>
                  download(
                    `/api/calibrate/${f.key}`,
                    `${f.key}_calibrate.pdf`,
                    `cal_${f.key}`
                  )
                }
              >
                {dlStatus[`cal_${f.key}`] === "loading" ? <><span className="btn-spinner" /> Downloading…</> :
                 dlStatus[`cal_${f.key}`] === "done"    ? "✓ Downloaded!" :
                 dlStatus[`cal_${f.key}`] === "error"   ? "✗ Error" :
                 f.calibrate_ready
                   ? `⬇ Calibration Grid  (${f.calibrate_size_kb} KB)`
                   : "Grid not generated"}
              </button>
            </div>

            {/* Field count hint */}
            <p className="pt-hint">
              Edit <code>pdf_filler.py → COORDS["{f.key}"]</code>
            </p>
          </div>
        ))}
      </div>

      {/* Field reference */}
      <div className="pt-ref">
        <h3 className="pt-ref-title">Quick field reference — what lives in each form</h3>
        <table className="pt-ref-table">
          <thead>
            <tr><th>Form</th><th>Student fields</th><th>Tick/checkbox fields</th><th>Official use fields</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>AKD-01</td>
              <td>student_name, student_no, programme, phone_no, address, institution_name, student_date</td>
              <td>tick_job_offer, tick_transfer, tick_personal</td>
              <td>director_comments, director_approved_tick, director_not_approved_tick, director_date</td>
            </tr>
            <tr>
              <td>AKD-02</td>
              <td>student_no, student_name, phone_no, centre, programme, semester, session, course_row_1–3 (no/code/name/exam_dt), student_date</td>
              <td>tick_illness, tick_death, tick_failed</td>
              <td>director_agree_tick, director_disagree_tick, director_comments, director_date</td>
            </tr>
            <tr>
              <td>AKD-03</td>
              <td>student_no, programme, student_name, receipt_no, receipt_date, amount_paid, faculty, phone_no, semester, session, course_row_1–2 (no/code/name/grade/lecturer/offering_centre), student_date</td>
              <td>—</td>
              <td>(committee section — manual)</td>
            </tr>
            <tr>
              <td>AKD-04</td>
              <td>student_name, student_no, programme, phone_no, address, reason_text, date_of_absence, course_row_1–2 (code/name), student_date</td>
              <td>course_row_1/2_tick_kuliah / _tutorial / _amali, director_approved_tick, director_not_approved_tick</td>
              <td>director_comments, director_date</td>
            </tr>
            <tr>
              <td>AKD-05</td>
              <td>applicant_name, position, phone_no, purpose, booking_date, student_date</td>
              <td>tick_bk_1–4, tick_bt_1–5, tick_bta_6–9, director_approved_tick, director_not_approved_tick</td>
              <td>director_comments, director_date</td>
            </tr>
            <tr>
              <td>AKD-06</td>
              <td>student_name, ic_number, matric_no, phone_no, student_date</td>
              <td>tick_kuliah, tick_tutorial, tick_amali, tick_kerajaan, tick_swasta, director_approved_tick, director_not_approved_tick</td>
              <td>director_comments, director_date</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PdfTools;
