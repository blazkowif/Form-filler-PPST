// =============================================================
// src/forms/NonSickLeaveForm.jsx — PPST/AKD-04
// =============================================================
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  FormWrapper, FormSection, FormField, FormInput,
  FormTextarea, FormSelect, FormRow, FileUploadField, SubmitSection,
  EditableProfileSection,
} from "./FormWrapper";

const buildProfile = (user) => ({
  phone: user?.phone || "",
  ic_number: user?.ic_number || "",
  program: user?.profile?.program || "",
  lecture_group: user?.profile?.lecture_group || "",
  tutorial_group: user?.profile?.tutorial_group || "",
  practical_group: user?.profile?.practical_group || "",
  address: user?.profile?.address || "",
});

const useStudentProfile = (user) => {
  const [profile, setProfile] = useState(() => buildProfile(user));
  useEffect(() => {
    setProfile(buildProfile(user));
  }, [user]);
  return [profile, setProfile];
};

const ProfileSection = ({ user, profile, setProfile, onSave, isSaving, error }) => (
  <EditableProfileSection
    user={user}
    profile={profile}
    onChange={(e) => setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
    onSave={onSave}
    isSaving={isSaving}
    saveError={error}
  />
);

export const NonSickLeaveForm = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ reason_text: "", date_of_absence: "", course_row_1_code: "", course_row_1_name: "" });
  const [profile, setProfile] = useStudentProfile(user);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [profileError, setProfileError] = useState("");

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSaveProfile = async () => {
    setProfileError("");
    setIsSavingProfile(true);
    try {
      await updateProfile({
        phone: profile.phone,
        ic_number: profile.ic_number,
        profile: {
          program: profile.program,
          lecture_group: profile.lecture_group,
          tutorial_group: profile.tutorial_group,
          practical_group: profile.practical_group,
          address: profile.address,
        },
      });
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to save profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!form.reason_text || !form.date_of_absence || !form.course_row_1_code || !form.course_row_1_name) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    setIsLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
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
    <FormWrapper code="PPST/AKD-04" title="Absence Justification"
      subtitle="Borang Tunjuk Sebab Tidak Hadir Kuliah/Tutorial/Amali"
      icon="📅" color="#d97706" bg="#fffbeb"
      isSubmitted={isSubmitted} applicationId={applicationId}>
      <form onSubmit={handleSubmit}>
        <ProfileSection user={user} profile={profile} setProfile={setProfile} onSave={handleSaveProfile} isSaving={isSavingProfile} error={profileError} />
        <FormSection title="Absence Details">
          <FormRow>
            <FormField label="Date of Absence (From)" required>
              <FormInput type="date" name="date_of_absence" value={form.date_of_absence} onChange={handleChange} required />
            </FormField>
            <FormField label="Course Code" required>
              <FormInput type="text" name="course_row_1_code" value={form.course_row_1_code} onChange={handleChange} required />
            </FormField>
          </FormRow>
          <FormField label="Course Name" required>
            <FormInput type="text" name="course_row_1_name" value={form.course_row_1_name} onChange={handleChange} required />
          </FormField>
          <FormField label="Reasons for Absence" required hint="Describe your reason for absence. Include course code and class type (Lecture/Tutorial/Practical).">
            <FormTextarea name="reason_text" value={form.reason_text} onChange={handleChange}
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

export const AppealReviewForm = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    semester: "", session: "", course_row_1_code: "", course_row_1_name: "",
    course_row_1_grade: "", course_row_1_lecturer: "", course_row_1_offering_centre: "",
    receipt_no: "", receipt_date: "", amount_paid: "100",
  });
  const [profile, setProfile] = useStudentProfile(user);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [profileError, setProfileError] = useState("");

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSaveProfile = async () => {
    setProfileError("");
    setIsSavingProfile(true);
    try {
      await updateProfile({
        phone: profile.phone,
        ic_number: profile.ic_number,
        profile: {
          program: profile.program,
          lecture_group: profile.lecture_group,
          tutorial_group: profile.tutorial_group,
          practical_group: profile.practical_group,
          address: profile.address,
        },
      });
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to save profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const required = ["semester", "session", "course_row_1_code", "course_row_1_name", "course_row_1_grade", "course_row_1_lecturer", "course_row_1_offering_centre", "receipt_no", "receipt_date", "amount_paid"];
    const missing = required.filter((key) => !form[key]);
    if (missing.length) {
      setSubmitError(`Missing required fields: ${missing.join(", ")}.`);
      return;
    }
    setIsLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (file) payload.append("file", file);
      const res = await api.post("/forms/submit/appeal_review", payload, {
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
    <FormWrapper code="PPST/AKD-02" title="Replacement / Repeat Exam"
      subtitle="Peperiksaan Gantian / Ulangan"
      icon="📝" color="#2563eb" bg="#eff6ff"
      isSubmitted={isSubmitted} applicationId={applicationId}>
      <form onSubmit={handleSubmit}>
        <ProfileSection user={user} profile={profile} setProfile={setProfile} onSave={handleSaveProfile} isSaving={isSavingProfile} error={profileError} />
        <FormSection title="Payment Information">
          <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:"8px",padding:"0.75rem 1rem",marginBottom:"0.75rem",fontSize:"0.8rem",color:"#92400e"}}>
            A fee of <strong>RM100.00</strong> is charged per course. Payment must be made at the Bursary Counter. Payment is not refundable.
          </div>
          <FormRow>
            <FormField label="Payment Receipt / Reference No." required>
              <FormInput type="text" name="receipt_no" value={form.receipt_no} onChange={handleChange} placeholder="e.g. RCP-2025-00123" required />
            </FormField>
            <FormField label="Amount Paid (RM)" required>
              <FormInput type="number" name="amount_paid" value={form.amount_paid} onChange={handleChange} min="100" step="100" required />
            </FormField>
          </FormRow>
          <FileUploadField label="Payment Receipt (Original Copy)" name="file" required hint="Please attach the original copy of your payment receipt from the Bursary." onChange={(e) => setFile(e.target.files[0] || null)} currentFile={file} />
        </FormSection>
        <FormSection title="Examination Details">
          <FormRow>
            <FormField label="Semester" required>
              <FormInput type="number" name="semester" value={form.semester} onChange={handleChange} min="1" max="3" placeholder="e.g. 1" required />
            </FormField>
            <FormField label="Session" required>
              <FormInput type="text" name="session" value={form.session} onChange={handleChange} placeholder="e.g. 2024/2025" required />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Course Code" required>
              <FormInput type="text" name="course_row_1_code" value={form.course_row_1_code} onChange={handleChange} placeholder="e.g. PHY1114" required />
            </FormField>
            <FormField label="Current Grade" required>
              <FormInput type="text" name="course_row_1_grade" value={form.course_row_1_grade} onChange={handleChange} placeholder="e.g. D, E, F" required />
            </FormField>
          </FormRow>
          <FormField label="Course Name" required>
            <FormInput type="text" name="course_row_1_name" value={form.course_row_1_name} onChange={handleChange} placeholder="e.g. Physics I" required />
          </FormField>
          <FormField label="Lecturer's Name" required>
            <FormInput type="text" name="course_row_1_lecturer" value={form.course_row_1_lecturer} onChange={handleChange} placeholder="e.g. Dr. Ahmad bin Abdullah" required />
          </FormField>
          <FormField label="Receipt Date" required>
            <FormInput type="date" name="receipt_date" value={form.receipt_date} onChange={handleChange} required />
          </FormField>
        </FormSection>
        <SubmitSection isLoading={isLoading} onCancel={() => navigate(-1)} error={submitError} />
      </form>
    </FormWrapper>
  );
};

export const WithdrawalForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ withdrawal_reason: "", institution_name: "" });
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!form.withdrawal_reason) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    setIsLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (file) payload.append("file", file);
      const res = await api.post("/forms/submit/withdrawal", payload, {
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
            Ensure you have settled all fees and returned all UMS property before submitting.
          </div>
          <FormField label="Reason for Withdrawal" required>
            <FormSelect name="withdrawal_reason" value={form.withdrawal_reason} onChange={handleChange} required>
              <option value="">-- Select Reason --</option>
              <option value="job_offer">Received a Job Offer</option>
              <option value="transfer">Continuing Studies at Another Institution</option>
              <option value="personal">Personal Problems</option>
            </FormSelect>
          </FormField>
          <FormField label="Institution Name">
            <FormInput name="institution_name" value={form.institution_name} onChange={handleChange}
              placeholder="Required when transferring" />
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
  const [form, setForm] = useState({
    semester: "", session: "", exam_reason: "", course_row_1_code: "",
    course_row_1_name: "", course_row_1_exam_dt: "",
  });
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!form.semester || !form.session || !form.exam_reason || !form.course_row_1_code || !form.course_row_1_name || !form.course_row_1_exam_dt) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    setIsLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (file) payload.append("file", file);
      const res = await api.post("/forms/submit/exam_replacement", payload, {
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
    <FormWrapper code="PPST/AKD-02" title="Replacement / Repeat Examination"
      subtitle="Permohonan Peperiksaan Gantian / Ulangan / Ulangan Khas"
      icon="📝" color="#059669" bg="#ecfdf5"
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
            Application must be submitted within 48 hours after the examination date.
          </div>
          <FormField label="Basis for Appeal" required>
            <FormSelect name="exam_reason" value={form.exam_reason} onChange={handleChange} required>
              <option value="">-- Select Basis --</option>
              <option value="Illness (with Medical Certificate)">Illness (Attach MC from doctor)</option>
              <option value="Bereavement (Death in family)">Bereavement - Death in Family (Attach death cert)</option>
              <option value="Course Failure">Course Failure (Repeat Exam)</option>
            </FormSelect>
          </FormField>
          <FormRow>
            <FormField label="Original Exam Date" required>
              <FormInput type="number" name="semester" value={form.semester} onChange={handleChange} min="1" max="3" required />
            </FormField>
            <FormField label="Original Exam End Time / Date">
              <FormInput type="text" name="session" value={form.session} onChange={handleChange} required />
            </FormField>
          </FormRow>
          <FormField label="Course(s) to be Replaced / Repeated" required hint="List the course code(s) and name(s), e.g. PHY1114 - Physics I">
            <FormInput type="text" name="course_row_1_code" value={form.course_row_1_code} required onChange={handleChange} />
          </FormField>
          <FormField label="Course Name" required>
            <FormInput type="text" name="course_row_1_name" value={form.course_row_1_name} required onChange={handleChange} />
          </FormField>
          <FormField label="Exam Date" required>
            <FormInput type="date" name="course_row_1_exam_dt" value={form.course_row_1_exam_dt} required onChange={handleChange} />
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
  const [form, setForm] = useState({ room_choice: "", purpose: "", booking_date: "", Others_rooms: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    api.get("/schedule").then((res) => setSchedule(res.data.data)).catch(() => setSchedule(null));
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!form.room_choice || !form.purpose || !form.booking_date) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post("/forms/submit/room_booking", {
        ...form,
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
            Completed form must be submitted 7 days before the booking date.
          </div>
          <div style={{background:"#fffbeb",border:"1px solid #fbbf24",borderRadius:"8px",padding:"0.75rem 1rem",marginBottom:"0.75rem",fontSize:"0.8rem",color:"#854d0e"}}>
            <strong>⚠ Check the class schedule first.</strong> Existing classes may occupy your chosen room. This is a warning only; you can still submit a request.
            <button type="button" onClick={() => navigate("/student/schedule")} style={{marginLeft:"0.5rem",border:0,background:"transparent",color:"#92400e",fontWeight:700,cursor:"pointer",textDecoration:"underline"}}>View Jadual</button>
            {form.room_choice && schedule?.schedule?.some((item) => item.venueId === form.room_choice) && (
              <div style={{marginTop:"0.4rem"}}>This room appears in the timetable. Review the selected date and time manually before submitting.</div>
            )}
          </div>
          <FormRow>
            <FormField label="Room Choice" required>
              <FormSelect name="room_choice" value={form.room_choice} onChange={handleChange} required>
                <option value="">-- Select Room --</option>
                {['BK1', 'BK2', 'BK3', 'BK4', 'BT1', 'BT2', 'BT3', 'BT4', 'BT5', 'BTA6', 'BTA7', 'BTA8', 'BTA9'].map((room) => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </FormSelect>
            </FormField>
            <FormField label="Other Room">
              <FormInput name="Others_rooms" value={form.Others_rooms} onChange={handleChange} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Purpose / Tujuan Tempahan" required>
            <FormTextarea name="purpose" value={form.purpose} onChange={handleChange}
              placeholder="e.g. Group study session for PHY1114 final exam preparation..." required />
            </FormField>
            <FormField label="Booking Date" required>
              <FormInput type="date" name="booking_date" value={form.booking_date} onChange={handleChange} required />
            </FormField>
          </FormRow>
        </FormSection>

        <SubmitSection isLoading={isLoading} onCancel={() => navigate(-1)} error={submitError}
          submitLabel="Submit Booking Request" />
      </form>
    </FormWrapper>
  );
};


// =============================================================
// src/forms/RoomBookingForm.jsx — PPST/AKD-05
// =============================================================
