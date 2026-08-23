import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEntriesStore } from "@/features/entries/store/entriesStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { wordCount, EMPTY_FILTERS } from "@/features/practice/hooks/usePracticeEntries";
import { entriesApi } from "@/api/api";
import { FiChevronRight, FiLock } from "react-icons/fi";

const MODES = [
  { key: "flashcards" as const, icon: "🃏", route: "/flashcards", min: 1 },
  { key: "quiz" as const, icon: "🧠", route: "/practice/quiz", min: 4 },
  { key: "match" as const, icon: "🔗", route: "/practice/match", min: 2 },
  { key: "puzzle" as const, icon: "🧩", route: "/practice/puzzle", min: 1 },
  { key: "write" as const, icon: "✍️", route: "/practice/write", min: 1 },
  { key: "custom" as const, icon: "🎨", route: "/practice/custom", min: 1, emphasized: true },
];

export function PracticePage() {
  const { t } = useTranslation();
  const entries = useEntriesStore((s) => s.entries);
  const navigate = useNavigate();
  const authMode = useAuthStore((s) => s.mode);
  const [dueCount, setDueCount] = useState<number | null>(null);

  useEffect(() => {
    if (authMode !== "authenticated") return;
    entriesApi
      .getDueEntries()
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
      write: base.filter((e) => ["word", "phrase", "idiom"].includes(e.category)).length,
      custom: base.length,
    };
  }, [entries]);

  return (
    <div className="flex flex-col gap-2 sm:gap-4 py-4 sm:pt-0 3xl:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="hidden sm:block px-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("practice.title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t("practice.subtitle")}</p>
      </div>

      {/* Due Today — full-width featured card */}
      <div
        onClick={() => navigate("/practice/due")}
        className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4 sm:p-5 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-2xl shrink-0">
          📅
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t("practice.modes.due.label")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t("practice.modes.due.description")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
            {dueCount ?? "…"}
          </span>
          <FiChevronRight className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
        </div>
      </div>

      {/* Mode cards — single column on mobile, 2-col grid on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {MODES.map((mode) => {
          const count = counts[mode.key];
          const disabled = count < mode.min;
          return (
            <div
              key={mode.key}
              onClick={disabled ? undefined : () => navigate(mode.route)}
              className={[
                "rounded-2xl border p-4 flex items-center gap-3 sm:gap-4 transition-all shadow-[rgba(50,50,93,0.25)_0px_2px_5px_-1px,rgba(0,0,0,0.3)_0px_1px_3px_-1px]",
                disabled
                  ? "group bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/50 opacity-60"
                  : mode.emphasized
                    ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 cursor-pointer hover:shadow-md hover:border-violet-400 dark:hover:border-violet-600"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10",
              ].join(" ")}>
              {/* Icon */}
              <div
                className={[
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0",
                  mode.emphasized ? "bg-violet-100 dark:bg-violet-900/40" : "bg-gray-100 dark:bg-gray-700/50",
                ].join(" ")}>
                {mode.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {t(`practice.modes.${mode.key}.label`)}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {t(`practice.modes.${mode.key}.description`)}
                </p>
                {/* Desktop: status text below description */}
                <p
                  className={[
                    "hidden sm:block text-xs mt-1",
                    disabled
                      ? "text-gray-400 dark:text-gray-500 italic group-hover:text-orange-500"
                      : "text-gray-400 dark:text-gray-500",
                  ].join(" ")}>
                  {disabled
                    ? t("practice.needAtLeast", { count: mode.min })
                    : t("practice.entriesAvailable", { count })}
                </p>
              </div>

              {/* Right: count badge + arrow or lock */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      disabled
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:text-orange-500"
                        : mode.emphasized
                          ? "bg-violet-500 text-white dark:bg-purple-950/40 dark:text-violet-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-green-950/40 dark:text-emerald-400",
                    ].join(" ")}>
                    {count}
                  </span>
                  {disabled ? (
                    <FiLock className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-orange-500" />
                  ) : (
                    <FiChevronRight
                      className={[
                        "w-5 h-5",
                        mode.emphasized ? "text-violet-400 dark:text-violet-500" : "text-gray-400 dark:text-gray-500",
                      ].join(" ")}
                    />
                  )}
                </div>
                {/* Mobile: status text below badge (only on mobile) */}
                {disabled && (
                  <span className="sm:hidden text-xs text-gray-400 dark:text-gray-500 italic text-right group-hover:text-orange-500">
                    {t("practice.needAtLeast", { count: mode.min })}
                  </span>
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
