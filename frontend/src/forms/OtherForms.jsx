// =============================================================
// src/forms/NonSickLeaveForm.jsx — PPST/AKD-07
// =============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  FormWrapper, FormSection, FormField, FormInput,
  FormTextarea, FormRow, FileUploadField, SubmitSection,
} from "./FormWrapper";

export const NonSickLeaveForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]           = useState({ reason: "", start_date: "", end_date: "" });
  const [file, setFile]           = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [submitError, setSubmitError]     = useState("");

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!form.reason || !form.start_date) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    setIsLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => payload.append(k, v));
      if (file) payload.append("file", file);
      const res = await api.post("/forms/submit/non_sick_leave", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setApplicationId(res.data.data.application_id);
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Submission failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormWrapper code="PPST/AKD-07" title="Non-Sick Leave / Absence Justification"
      subtitle="Borang Tunjuk Sebab Tidak Hadir Kuliah/Tutorial/Amali"
      icon="📅" color="#d97706" bg="#fffbeb"
      isSubmitted={isSubmitted} applicationId={applicationId}>
      <form onSubmit={handleSubmit}>
        <FormSection title="Applicant Information">
          <FormRow>
            <FormField label="Student Name"><FormInput value={user?.name || ""} disabled /></FormField>
            <FormField label="Matric Number"><FormInput value={user?.matric_staff_id || ""} disabled /></FormField>
          </FormRow>
          <FormRow>
            <FormField label="Programme"><FormInput value={user?.profile?.program || ""} disabled /></FormField>
            <FormField label="Phone No."><FormInput value={user?.phone || ""} disabled /></FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Absence Details">
          <FormRow>
            <FormField label="Date of Absence (From)" required>
              <FormInput type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
            </FormField>
            <FormField label="Date of Absence (To)" hint="Leave blank for a single day">
              <FormInput type="date" name="end_date" value={form.end_date} onChange={handleChange} min={form.start_date} />
            </FormField>
          </FormRow>
          <FormField label="Reasons for Absence" required
            hint="Describe your reason for absence. Include course code and class type (Lecture/Tutorial/Practical).">
            <FormTextarea name="reason" value={form.reason} onChange={handleChange}
              placeholder="e.g. I was unable to attend PHY1114 Lecture on 2 Jan 2025 due to a family emergency…" required />
          </FormField>
          <FileUploadField label="Supporting Document" name="file"
            hint="Attach any supporting evidence (e.g. letter, receipt). Optional."
            onChange={(e) => setFile(e.target.files[0] || null)} currentFile={file} />
        </FormSection>

        <SubmitSection isLoading={isLoading} onCancel={() => navigate(-1)} error={submitError} />
      </form>
    </FormWrapper>
  );
};

// =============================================================
// src/forms/AppealReviewForm.jsx — PPST/AKD-03
// =============================================================
export const AppealReviewForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    reason: "", semester: "", session: "", course_code: "", course_name: "",
    grade: "", lecturer_name: "", receipt_no: "", amount_paid: "100",
  });
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [submitError, setSubmitError]     = useState("");

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const required = ["reason","semester","session","course_code","course_name","grade","lecturer_name","receipt_no","amount_paid"];
    const missing = required.filter((k) => !form[k]);
    if (missing.length) { setSubmitError(`Missing required fields: ${missing.join(", ")}.`); return; }
    setIsLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => payload.append(k, v));
      if (file) payload.append("file", file);
      const res = await api.post("/forms/submit/appeal_review", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setApplicationId(res.data.data.application_id);
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Submission failed.");
    } finally { setIsLoading(false); }
  };

  return (
    <FormWrapper code="PPST/AKD-03" title="Appeal for Review of Examination Results"
      subtitle="Rayuan Semakan Semula Keputusan Peperiksaan"
      icon="📝" color="#2563eb" bg="#eff6ff"
      isSubmitted={isSubmitted} applicationId={applicationId}>
      <form onSubmit={handleSubmit}>
        <FormSection title="Applicant Information">
          <FormRow>
            <FormField label="Student Name"><FormInput value={user?.name || ""} disabled /></FormField>
            <FormField label="Student ID"><FormInput value={user?.matric_staff_id || ""} disabled /></FormField>
          </FormRow>
          <FormRow>
            <FormField label="Programme"><FormInput value={user?.profile?.program || ""} disabled /></FormField>
            <FormField label="Phone No."><FormInput value={user?.phone || ""} disabled /></FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Payment Information">
          <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:"8px",padding:"0.75rem 1rem",marginBottom:"0.75rem",fontSize:"0.8rem",color:"#92400e"}}>
            ⚠️ A fee of <strong>RM100.00</strong> is charged per course. Payment must be made at the Bursary Counter. Payment is not refundable.
          </div>
          <FormRow>
            <FormField label="Payment Receipt / Reference No." required>
              <FormInput type="text" name="receipt_no" value={form.receipt_no} onChange={handleChange}
                placeholder="e.g. RCP-2025-00123" required />
            </FormField>
            <FormField label="Amount Paid (RM)" required>
              <FormInput type="number" name="amount_paid" value={form.amount_paid} onChange={handleChange}
                min="100" step="100" required />
            </FormField>
          </FormRow>
          <FileUploadField label="Payment Receipt (Original Copy)" name="file" required
            hint="Please attach the original copy of your payment receipt from the Bursary."
            onChange={(e) => setFile(e.target.files[0] || null)} currentFile={file} />
        </FormSection>

        <FormSection title="Examination Details">
          <FormRow>
            <FormField label="Semester" required>
              <FormInput type="number" name="semester" value={form.semester} onChange={handleChange}
                min="1" max="3" placeholder="e.g. 1" required />
            </FormField>
            <FormField label="Session" required>
              <FormInput type="text" name="session" value={form.session} onChange={handleChange}
                placeholder="e.g. 2024/2025" required />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Course Code" required>
              <FormInput type="text" name="course_code" value={form.course_code} onChange={handleChange}
                placeholder="e.g. PHY1114" required />
            </FormField>
            <FormField label="Current Grade" required>
              <FormInput type="text" name="grade" value={form.grade} onChange={handleChange}
                placeholder="e.g. D, E, F" required />
            </FormField>
          </FormRow>
          <FormField label="Course Name" required>
            <FormInput type="text" name="course_name" value={form.course_name} onChange={handleChange}
              placeholder="e.g. Physics I" required />
          </FormField>
          <FormField label="Lecturer's Name" required>
            <FormInput type="text" name="lecturer_name" value={form.lecturer_name} onChange={handleChange}
              placeholder="e.g. Dr. Ahmad bin Abdullah" required />
          </FormField>
          <FormField label="Reason for Appeal" required>
            <FormTextarea name="reason" value={form.reason} onChange={handleChange}
              placeholder="Explain why you believe your examination result should be reviewed…" required />
          </FormField>
        </FormSection>

        <SubmitSection isLoading={isLoading} onCancel={() => navigate(-1)} error={submitError} />
      </form>
    </FormWrapper>
  );
};

// =============================================================
// src/forms/WithdrawalForm.jsx — PPST/AKD-01
// =============================================================
export const WithdrawalForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]           = useState({ reason: "", withdrawal_type: "" });
  const [file, setFile]           = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [submitError, setSubmitError]     = useState("");

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!form.reason || !form.withdrawal_type) { setSubmitError("Please fill in all required fields."); return; }
    setIsLoading(true);
    try {
      const payload = new FormData();
      const fullReason = `Reason: ${form.withdrawal_type}. ${form.reason}`;
      payload.append("reason", fullReason);
      if (file) payload.append("file", file);
      const res = await api.post("/forms/submit/withdrawal", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setApplicationId(res.data.data.application_id);
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Submission failed.");
    } finally { setIsLoading(false); }
  };

  return (
    <FormWrapper code="PPST/AKD-01" title="Application for Withdrawal from Studies"
      subtitle="Permohonan Berhenti Pengajian"
      icon="🎓" color="#7c3aed" bg="#f5f3ff"
      isSubmitted={isSubmitted} applicationId={applicationId}>
      <form onSubmit={handleSubmit}>
        <FormSection title="Applicant Information">
          <FormRow>
            <FormField label="Student Name"><FormInput value={user?.name || ""} disabled /></FormField>
            <FormField label="Student No."><FormInput value={user?.matric_staff_id || ""} disabled /></FormField>
          </FormRow>
          <FormRow>
            <FormField label="Programme / Course"><FormInput value={user?.profile?.program || ""} disabled /></FormField>
            <FormField label="Phone No."><FormInput value={user?.phone || ""} disabled /></FormField>
          </FormRow>
          <FormField label="Address">
            <FormInput value={user?.profile?.address || ""} disabled />
          </FormField>
        </FormSection>

        <FormSection title="Withdrawal Details">
          <div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:"8px",padding:"0.75rem 1rem",marginBottom:"0.75rem",fontSize:"0.8rem",color:"#92400e"}}>
            ⚠️ <strong>This action is irreversible.</strong> Ensure you have settled all fees and returned all UMS property before submitting.
          </div>
          <FormField label="Reason for Withdrawal" required>
            <FormSelect name="withdrawal_type" value={form.withdrawal_type} onChange={handleChange} required>
              <option value="">-- Select Reason --</option>
              <option value="Received a job offer">Received a Job Offer</option>
              <option value="Continuing studies at another institution">Continuing Studies at Another Institution</option>
              <option value="Personal problems">Personal Problems</option>
              <option value="Financial difficulties">Financial Difficulties</option>
              <option value="Health reasons">Health Reasons</option>
              <option value="Other">Other</option>
            </FormSelect>
          </FormField>
          <FormField label="Additional Details" required hint="Provide more details about your reason for withdrawal.">
            <FormTextarea name="reason" value={form.reason} onChange={handleChange}
              placeholder="Please describe your reason in detail…" required />
          </FormField>
          <FileUploadField label="Supporting Document" name="file"
            hint="Attach supporting document (e.g. job offer letter, letter from new institution)."
            onChange={(e) => setFile(e.target.files[0] || null)} currentFile={file} />
        </FormSection>

        <SubmitSection isLoading={isLoading} onCancel={() => navigate(-1)} error={submitError}
          submitLabel="Submit Withdrawal Application" />
      </form>
    </FormWrapper>
  );
};

// =============================================================
// src/forms/ExamReplacementForm.jsx — PPST/AKD-02
// =============================================================
export const ExamReplacementForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ reason: "", start_date: "", end_date: "", exam_reason: "" });
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [submitError, setSubmitError]     = useState("");

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!form.reason || !form.start_date || !form.exam_reason) {
      setSubmitError("Please fill in all required fields."); return;
    }
    setIsLoading(true);
    try {
      const payload = new FormData();
      payload.append("reason", `Basis: ${form.exam_reason}. Details: ${form.reason}`);
      payload.append("start_date", form.start_date);
      if (form.end_date) payload.append("end_date", form.end_date);
      if (file) payload.append("file", file);
      const res = await api.post("/forms/submit/exam_replacement", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setApplicationId(res.data.data.application_id);
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Submission failed.");
    } finally { setIsLoading(false); }
  };

  return (
    <FormWrapper code="PPST/AKD-02" title="Replacement / Repeat Examination"
      subtitle="Permohonan Peperiksaan Gantian / Ulangan / Ulangan Khas"
      icon="✏️" color="#059669" bg="#ecfdf5"
      isSubmitted={isSubmitted} applicationId={applicationId}>
      <form onSubmit={handleSubmit}>
        <FormSection title="Applicant Information">
          <FormRow>
            <FormField label="Student Name"><FormInput value={user?.name || ""} disabled /></FormField>
            <FormField label="Student No."><FormInput value={user?.matric_staff_id || ""} disabled /></FormField>
          </FormRow>
          <FormRow>
            <FormField label="Programme"><FormInput value={user?.profile?.program || ""} disabled /></FormField>
            <FormField label="Phone No."><FormInput value={user?.phone || ""} disabled /></FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Application Details">
          <div style={{background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:"8px",padding:"0.75rem 1rem",marginBottom:"0.75rem",fontSize:"0.8rem",color:"#065f46"}}>
            ⏰ Application must be submitted within <strong>48 hours</strong> after the examination date.
          </div>
          <FormField label="Basis for Appeal" required>
            <FormSelect name="exam_reason" value={form.exam_reason} onChange={handleChange} required>
              <option value="">-- Select Basis --</option>
              <option value="Illness (with Medical Certificate)">Illness (Attach MC from doctor)</option>
              <option value="Bereavement (Death in family)">Bereavement — Death in Family (Attach death cert)</option>
              <option value="Course Failure">Course Failure (Repeat Exam)</option>
            </FormSelect>
          </FormField>
          <FormRow>
            <FormField label="Original Exam Date" required>
              <FormInput type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
            </FormField>
            <FormField label="Original Exam End Time / Date">
              <FormInput type="date" name="end_date" value={form.end_date} onChange={handleChange} />
            </FormField>
          </FormRow>
          <FormField label="Course(s) to be Replaced / Repeated" required
            hint="List the course code(s) and name(s), e.g. PHY1114 — Physics I">
            <FormTextarea name="reason" value={form.reason} onChange={handleChange}
              placeholder="e.g. PHY1114 — Physics I (Date: 10 Jan 2025, 9:00AM)…" required />
          </FormField>
          <FileUploadField label="Supporting Document (MC / Death Certificate)" name="file" required
            hint="Attach your Medical Certificate or Death Certificate as supporting evidence."
            onChange={(e) => setFile(e.target.files[0] || null)} currentFile={file} />
        </FormSection>

        <SubmitSection isLoading={isLoading} onCancel={() => navigate(-1)} error={submitError} />
      </form>
    </FormWrapper>
  );
};

// =============================================================
// src/forms/RoomBookingForm.jsx — PPST/AKD-05
// =============================================================
export const RoomBookingForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    reason: "", start_date: "", end_date: "",
    room_type: "", room_number: "", time_start: "", time_end: "",
  });
  const [isLoading, setIsLoading]     = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [submitError, setSubmitError]     = useState("");

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const ROOM_NUMBERS = {
    "Lecture Room (BK)": ["BK1", "BK2", "BK3", "BK4"],
    "Tutorial Room (BT) — PPST Building": ["BT1", "BT2", "BT3", "BT4", "BT5"],
    "Tutorial Room (BT) — Annex Building": ["BT6", "BT7", "BT8", "BT9"],
    "Other Room": ["Other"],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!form.reason || !form.start_date || !form.room_type || !form.room_number) {
      setSubmitError("Please fill in all required fields."); return;
    }
    setIsLoading(true);
    try {
      const fullReason = `Room: ${form.room_number} (${form.room_type}). Time: ${form.time_start}–${form.time_end}. Purpose: ${form.reason}`;
      const res = await api.post("/forms/submit/room_booking", {
        reason: fullReason,
        start_date: form.start_date,
        end_date: form.end_date || form.start_date,
      });
      setApplicationId(res.data.data.application_id);
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Submission failed.");
    } finally { setIsLoading(false); }
  };

  return (
    <FormWrapper code="PPST/AKD-05" title="Lecture / Tutorial Room Booking"
      subtitle="Borang Tempahan Bilik Kuliah / Bilik Tutorial"
      icon="🏛️" color="#0891b2" bg="#ecfeff"
      isSubmitted={isSubmitted} applicationId={applicationId}>
      <form onSubmit={handleSubmit}>
        <FormSection title="Applicant Information">
          <FormRow>
            <FormField label="Applicant Name"><FormInput value={user?.name || ""} disabled /></FormField>
            <FormField label="ID"><FormInput value={user?.matric_staff_id || ""} disabled /></FormField>
          </FormRow>
          <FormField label="Phone No."><FormInput value={user?.phone || ""} disabled /></FormField>
        </FormSection>

        <FormSection title="Booking Details">
          <div style={{background:"#ecfeff",border:"1px solid #a5f3fc",borderRadius:"8px",padding:"0.75rem 1rem",marginBottom:"0.75rem",fontSize:"0.8rem",color:"#164e63"}}>
            📅 Completed form must be submitted <strong>7 days before</strong> the booking date.
          </div>
          <FormRow>
            <FormField label="Room Type" required>
              <FormSelect name="room_type" value={form.room_type} onChange={(e) => {
                setForm((p) => ({ ...p, room_type: e.target.value, room_number: "" }));
              }} required>
                <option value="">-- Select Room Type --</option>
                {Object.keys(ROOM_NUMBERS).map((rt) => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </FormSelect>
            </FormField>
            <FormField label="Room Number" required>
              <FormSelect name="room_number" value={form.room_number} onChange={handleChange}
                disabled={!form.room_type} required>
                <option value="">-- Select Room --</option>
                {(ROOM_NUMBERS[form.room_type] || []).map((rn) => (
                  <option key={rn} value={rn}>{rn}</option>
                ))}
              </FormSelect>
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Booking Date" required>
              <FormInput type="date" name="start_date" value={form.start_date} onChange={handleChange}
                min={new Date(Date.now() + 7*86400000).toISOString().split("T")[0]} required />
            </FormField>
            <FormField label="End Date (if multi-day)" hint="For single-day bookings, leave blank.">
              <FormInput type="date" name="end_date" value={form.end_date} onChange={handleChange}
                min={form.start_date} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Start Time" required>
              <FormInput type="time" name="time_start" value={form.time_start} onChange={handleChange} required />
            </FormField>
            <FormField label="End Time" required>
              <FormInput type="time" name="time_end" value={form.time_end} onChange={handleChange} required />
            </FormField>
          </FormRow>
          <FormField label="Purpose / Tujuan Tempahan" required>
            <FormTextarea name="reason" value={form.reason} onChange={handleChange}
              placeholder="e.g. Group study session for PHY1114 final exam preparation…" required />
          </FormField>
        </FormSection>

        <SubmitSection isLoading={isLoading} onCancel={() => navigate(-1)} error={submitError}
          submitLabel="Submit Booking Request" />
      </form>
    </FormWrapper>
  );
};
