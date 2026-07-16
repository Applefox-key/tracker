import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/features/auth/store/authStore";
import { authApi, getAvatarUrl } from "@/api/api";
import { useUserSettings } from "@/hooks/useUserSettings";
import { ALL_SPEECH_LANGS, type LangCode } from "@/lib/userSettings";

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateUser, setUser, logout, mode } = useAuthStore();
  const navigate = useNavigate();
  const { speechLangs, saveSpeechLangs } = useUserSettings();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarImgError, setAvatarImgError] = useState(false);

  const [pendingLangs, setPendingLangs] = useState<LangCode[]>(speechLangs);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const currentAvatar = avatarPreview ?? (user?.img && user?.id ? getAvatarUrl(user.img, user.id) : null);
  const initials = (user?.name?.[0] ?? "U").toUpperCase();

  useEffect(() => {
    setAvatarImgError(false);
  }, [currentAvatar]);

  const nameDirty = name.trim() !== (user?.name ?? "");
  const emailDirty = email.trim() !== (user?.email ?? "");
  const langsDirty = pendingLangs.length !== speechLangs.length || pendingLangs.some((l) => !speechLangs.includes(l));
  const isDirty = nameDirty || emailDirty || pendingFile !== null || langsDirty;

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setPendingFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setSaved(false);
  }

  function toggleLang(code: LangCode) {
    setPendingLangs((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      return next.length === 0 ? prev : next;
    });
    setSaved(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      if (pendingFile) {
        await authApi.uploadAvatar(pendingFile, user.id);
      }
      if (nameDirty || emailDirty) {
        await updateUser({ name: name.trim(), email: email.trim() });
      }
      if (langsDirty) {
        saveSpeechLangs(pendingLangs);
      }

      const fresh = await authApi.getUser();
      setUser(fresh);

      setPendingFile(null);
      setAvatarPreview(null);
      setSaved(true);
    } catch {
      setSaveError(t("profile.saveError"));
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const inputCls =
    "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("profile.title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t("profile.subtitle")}</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <p className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">{t("profile.photo")}</p>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="relative w-16 h-16 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
              {currentAvatar && !avatarImgError ? (
                <img
                  src={currentAvatar}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarImgError(true)}
                />
              ) : (
                <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-2xl font-semibold select-none">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
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
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 mt-0.5">
              {pendingFile ? t("profile.changeAgain") : t("profile.changePhoto")}
            </button>
          </div>
        </div>
        {pendingFile && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {t("profile.newPhotoSelected")}
          </p>
        )}
      </div>

      {/* Name & Email */}
      <div className="flex flex-col gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("profile.accountDetails")}</p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-name" className="text-sm text-gray-600 dark:text-gray-400">
            {t("profile.name")}
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            className={inputCls}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-email" className="text-sm text-gray-600 dark:text-gray-400">
            {t("profile.email")}
          </label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSaved(false);
            }}
            className={inputCls}
            readOnly
            tabIndex={-1}
          />
        </div>
      </div>

      {/* Speech languages */}
      <div className="flex flex-col gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("profile.speechLangs")}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {t("profile.speechLangsHint")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_SPEECH_LANGS.map(({ code, label, name: langName }) => {
            const active = pendingLangs.includes(code);
            const isLast = active && pendingLangs.length === 1;
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleLang(code)}
                disabled={isLast}
                title={langName}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                  active
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400",
                ].join(" ")}>
                <span className="font-mono text-xs">{label}</span>
                <span className="text-xs opacity-75">{langName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex items-center justify-between gap-4">
        <div className="text-sm">
          {saveError && <p className="text-red-600 dark:text-red-400">{saveError}</p>}
          {saved && <p className="text-emerald-600 dark:text-emerald-400">{t("profile.changesSaved")}</p>}
          {!saveError && !saved && isDirty && (
            <p className="text-gray-400 dark:text-gray-500">{t("profile.unsavedChanges")}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="shrink-0 px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? t("profile.saving") : t("profile.save")}
        </button>
      </div>

      {/* Logout - mobile only */}
      <div className="sm:hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {mode === "demo" ? t("layout.exitDemo") : t("layout.logout")}
        </button>
      </div>
    </div>
  );
}
