import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEntriesStore } from "@/features/entries/store/entriesStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { wordCount, EMPTY_FILTERS } from "@/features/practice/hooks/usePracticeEntries";
import { entriesApi } from "@/api/api";
import { Button } from "@/shared/ui/Button";

const MODES = [
  { key: "flashcards" as const, icon: "🃏", route: "/flashcards", min: 1 },
  { key: "quiz" as const, icon: "🧠", route: "/practice/quiz", min: 4 },
  { key: "match" as const, icon: "🔗", route: "/practice/match", min: 2 },
  { key: "puzzle" as const, icon: "🧩", route: "/practice/puzzle", min: 1 },
];

export function PracticePage() {
  const { t } = useTranslation();
  const entries = useEntriesStore((s) => s.entries);
  const navigate = useNavigate();
  const authMode = useAuthStore((s) => s.mode);
  const [dueCount, setDueCount] = useState<number | null>(null);

  useEffect(() => {
    if (authMode !== "authenticated") return;
    entriesApi.getDueEntries()
      .then((due) => setDueCount(due.length))
      .catch(() => setDueCount(0));
  }, [authMode]);

  const counts = useMemo(() => {
    const base = entries.filter((e) => e.includeInPractice);
    return {
      flashcards: base.length,
      quiz: base.filter((e) => e.category !== "note").length,
      match: base.filter((e) => e.category !== "note").length,
      puzzle: base.filter((e) => !["note", "grammar"].includes(e.category)).filter((e) => wordCount(e.word) <= 10)
        .length,
    };
  }, [entries]);

  return (
    <div className="flex flex-col gap-6 py-4 sm:py-auto lg:p-8">
      {/* Header */}
      <div className="hidden sm:block">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("practice.title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t("practice.subtitle")}</p>
      </div>

      {/* Due Today card */}
      <div
        onClick={() => navigate("/practice/due")}
        className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4 sm:p-6 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all">
        <span className="text-4xl leading-none shrink-0">📅</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("practice.modes.due.label")}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t("practice.modes.due.description")}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {dueCount !== null && dueCount > 0 && (
            <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {dueCount}
            </span>
          )}
          <Button
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600 text-white border-0"
            onClick={(e) => { e.stopPropagation(); navigate("/practice/due"); }}>
            {t("practice.start")}
          </Button>
        </div>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODES.map((mode) => {
          const count = counts[mode.key];
          const disabled = count < mode.min;
          return (
            <div
              key={mode.key}
              onClick={disabled ? undefined : () => navigate(mode.route)}
              className={[
                "bg-white dark:bg-gray-800 rounded-2xl border p-2 sm:p-6 flex flex-col gap-4 transition-all",
                disabled
                  ? "border-gray-100 dark:border-gray-700/50 opacity-60"
                  : "border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 cursor-pointer",
              ].join(" ")}>
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none">{mode.icon}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t(`practice.modes.${mode.key}.label`)}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {t(`practice.modes.${mode.key}.description`)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  {t("practice.entriesAvailable", { count })}
                </span>
                {disabled ? (
                  <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                    {t("practice.needAtLeast", { count: mode.min })}
                  </span>
                ) : (
                  <Button
                    className="bg-emerald-400 text-white hover:bg-emerald-700 focus:ring-emerald-400 transition-colors"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(mode.route);
                    }}>
                    {t("practice.start")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// keep EMPTY_FILTERS imported to avoid unused warning
void EMPTY_FILTERS;
