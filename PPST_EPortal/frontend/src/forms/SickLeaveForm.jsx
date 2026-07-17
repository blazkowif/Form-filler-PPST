// =============================================================
// src/forms/SickLeaveForm.jsx — PPST/AKD-06
// =============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  FormWrapper, FormSection, FormField, FormInput,
  FormTextarea, FormSelect, FormRow, FileUploadField, SubmitSection,
} from "./FormWrapper";

const SickLeaveForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    reason: "",
    start_date: "",
    end_date: "",
    hospital_type: "",
    hospital_name: "",
  });
  const [mcFile,       setMcFile]       = useState(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [isSubmitted,  setIsSubmitted]  = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [submitError,  setSubmitError]  = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!form.reason || !form.start_date || !form.hospital_type || !form.hospital_name) {
      setSubmitError("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      // Use FormData because we may have a file attachment
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => payload.append(k, v));
      if (mcFile) payload.append("mc_file", mcFile);

      const res = await api.post("/forms/submit/sick_leave", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setApplicationId(res.data.data.application_id);
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormWrapper
      code="PPST/AKD-06"
      title="Sick Leave Application"
      subtitle="Borang Permohonan Cuti Sakit"
      icon="🏥"
      color="#dc2626"
      bg="#fff5f5"
      isSubmitted={isSubmitted}
      applicationId={applicationId}
    >
      <form onSubmit={handleSubmit}>
        {/* Applicant Info (read-only) */}
        <FormSection title="Applicant Information">
          <FormRow>
            <FormField label="Student Name">
              <FormInput value={user?.name || ""} disabled />
            </FormField>
            <FormField label="Matric Number">
              <FormInput value={user?.matric_staff_id || ""} disabled />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Programme">
              <FormInput value={user?.profile?.program || ""} disabled />
            </FormField>
            <FormField label="IC Number">
              <FormInput value={user?.ic_number || ""} disabled />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Lecture Group">
              <FormInput value={user?.profile?.lecture_group || ""} disabled />
            </FormField>
            <FormField label="Tutorial Group">
              <FormInput value={user?.profile?.tutorial_group || ""} disabled />
            </FormField>
          </FormRow>
        </FormSection>

        {/* Leave Details */}
        <FormSection title="Leave Details">
          <FormRow>
            <FormField label="Start Date" required>
              <FormInput type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
            </FormField>
            <FormField label="End Date">
              <FormInput type="date" name="end_date" value={form.end_date} onChange={handleChange}
                min={form.start_date} />
            </FormField>
          </FormRow>

          <FormField label="Reason for Sick Leave" required>
            <FormTextarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Describe your illness or medical condition…"
              required
            />
          </FormField>
        </FormSection>

        {/* Hospital/Clinic Info */}
        <FormSection title="Hospital / Clinic Information">
          <FormField label="Hospital / Clinic Type" required>
            <FormSelect name="hospital_type" value={form.hospital_type} onChange={handleChange} required>
              <option value="">-- Select Type --</option>
              <option value="government">Government Hospital / Clinic (Kerajaan)</option>
              <option value="private">Private Hospital / Clinic (Swasta)</option>
            </FormSelect>
          </FormField>

          <FormField label="Hospital / Clinic Name" required>
            <FormInput
              type="text"
              name="hospital_name"
              value={form.hospital_name}
              onChange={handleChange}
              placeholder="e.g. Hospital Queen Elizabeth, Klinik Kesihatan KK"
              required
            />
          </FormField>

          <FileUploadField
            label="Medical Certificate / Doctor's Note"
            name="mc_file"
            required
            hint="Please attach the original MC from the doctor concerned (PDF, JPG, or PNG, max 10MB)."
            onChange={(e) => setMcFile(e.target.files[0] || null)}
            currentFile={mcFile}
          />
        </FormSection>

        <SubmitSection
          isLoading={isLoading}
          onCancel={() => navigate(-1)}
          error={submitError}
        />
      </form>
    </FormWrapper>
  );
};

export default SickLeaveForm;
