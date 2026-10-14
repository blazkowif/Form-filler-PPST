import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { EditableProfileSection } from "../../forms/FormWrapper";

const buildProfile = (user) => ({
  phone: user?.phone || "",
  ic_number: user?.ic_number || "",
  program: user?.profile?.program || "",
  lecture_group: user?.profile?.lecture_group || "",
  tutorial_group: user?.profile?.tutorial_group || "",
  practical_group: user?.profile?.practical_group || "",
  address: user?.profile?.address || "",
});

const StudentProfile = () => {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState(() => buildProfile(user));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(buildProfile(user));
  }, [user]);

  const handleSave = async () => {
    setSaveError("");
    setSaved(false);
    setIsSaving(true);
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
      setSaved(true);
    } catch (error) {
      setSaveError(error.response?.data?.message || "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-page-header">
        <div className="form-page-icon" style={{ background: "#eef2fb", color: "#003087" }}>👤</div>
        <div>
          <span className="form-page-code" style={{ color: "#003087" }}>STUDENT ACCOUNT</span>
          <h1 className="form-page-title">My Profile</h1>
          <p className="form-page-subtitle">Update your phone number and current address.</p>
        </div>
      </div>
      <div className="form-card">
        <EditableProfileSection
          user={user}
          profile={profile}
          onChange={(event) => {
            setSaved(false);
            setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
          }}
          onSave={handleSave}
          isSaving={isSaving}
          saveError={saveError}
          title="Personal Information"
        />
        {saved && <p className="field-hint" role="status">Profile saved successfully.</p>}
      </div>
    </div>
  );
};

export default StudentProfile;
