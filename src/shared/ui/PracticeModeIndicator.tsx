import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUserSettings } from "@/hooks/useUserSettings";

export function PracticeModeIndicator({ small }: { small?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tracker } = useUserSettings();
  if (tracker.practiceMode === false) return null;
  return (
    <button
      type="button"
      onClick={() => navigate("/profile?tab=settings")}
      title={t("practice.practiceModeHint")}
      className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-700 text-xs font-medium hover:bg-sky-100 dark:hover:bg-sky-800/40 transition-colors mt-0.5 relative ${small ? "top-[-10px]" : ""}`}>
      {t("practice.practiceModeIndicator")}
    </button>
  );
}
