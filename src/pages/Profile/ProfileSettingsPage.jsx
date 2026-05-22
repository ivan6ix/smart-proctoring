import { useEffect, useState } from "react";
import StudentTopbarLayout from "../../layouts/StudentTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function ProfileSettingsPage() {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setFullName(data.full_name || "");
      setSchoolId(data.school_id || "");
      setAvatarUrl(data.avatar_url || "");
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setUploading(true);

    const { data: userData } = await supabase.auth.getUser();
    const filePath = `${userData.user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-avatars")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      alert(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("profile-avatars")
      .getPublicUrl(filePath);

    setAvatarUrl(data.publicUrl);
    setUploading(false);
  };

  const saveProfile = async (e) => {
    e.preventDefault();

    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        school_id: schoolId,
        avatar_url: avatarUrl,
      })
      .eq("id", userData.user.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Profile updated successfully.");
    fetchProfile();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, []);

  return (
    <StudentTopbarLayout>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Profile Settings
        </h2>
        <p className="text-gray-500">
          Update your personal information and profile picture.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow p-6 border border-gray-100 max-w-3xl">
        <form onSubmit={saveProfile} className="space-y-5">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow">
              <img
                src={
                  avatarUrl ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <label className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold cursor-pointer">
                {uploading ? "Uploading..." : "Upload Picture"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded-2xl px-4 py-3"
            placeholder="Full Name"
          />

          <input
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="w-full border rounded-2xl px-4 py-3"
            placeholder="Student / Employee Number"
          />

          <input
            value={profile?.role || ""}
            disabled
            className="w-full border rounded-2xl px-4 py-3 bg-gray-100 text-gray-500"
            placeholder="Role"
          />

          <button
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </StudentTopbarLayout>
  );
}

export default ProfileSettingsPage;