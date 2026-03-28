import { useRef, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { authApi } from "@/api/api";

export function ProfilePage() {
  const { user, updateUser, setUser } = useAuthStore();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = name !== (user?.name ?? "") || email !== (user?.email ?? "");
  const currentAvatar = avatarPreview ?? user?.avatar ?? null;
  const initials = (user?.name?.[0] ?? "U").toUpperCase();

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setUploadError(null);
    setUploading(true);

    try {
      const updated = await authApi.uploadAvatar(file);
      setUser(updated);
      setAvatarPreview(null);
    } catch {
      setUploadError("Failed to upload avatar. Please try again.");
      setAvatarPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await updateUser({ name: name.trim(), email: email.trim() });
      setSaved(true);
    } catch {
      setSaveError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your account details</p>
      </div>

      {/* Avatar upload */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={uploading}
            className="relative w-16 h-16 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
            {currentAvatar ? (
              <img src={currentAvatar} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-2xl font-semibold select-none">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              {uploading ? (
                <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={uploading}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 mt-0.5 disabled:opacity-50">
            {uploading ? "Uploading…" : "Change photo"}
          </button>
        </div>
      </div>

      {uploadError && <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>}

      {/* Profile form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            className={inputCls}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setSaved(false); }}
            className={inputCls}
            required
          />
        </div>

        {saveError && <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>}
        {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Changes saved.</p>}

        <button
          type="submit"
          disabled={saving || !isDirty}
          className="mt-1 self-start px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
