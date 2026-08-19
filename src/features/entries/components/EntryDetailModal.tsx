import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Entry } from "../types";
import { MULTILINE_CATEGORIES } from "../constants";
import { Button } from "@/shared/ui/Button";
import { DualRating } from "@/shared/ui/DualRating";
import { EntryImage } from "@/shared/ui/EntryImage";
import { SpeakButton } from "@/shared/ui/SpeakButton";
import { getEntryImageUrl } from "@/api/api";
import { TbTargetArrow } from "react-icons/tb";

const categoryColors: Record<Entry["category"], string> = {
  word: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  phrase: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  grammar: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  idiom: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  note: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

interface EntryDetailModalProps {
  entry: Entry;
  onClose: () => void;
  onEdit: (entry: Entry) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function EntryDetailModal({ entry, onClose, onEdit, onPrev, onNext }: EntryDetailModalProps) {
  const { t } = useTranslation();
  const isMultiline = MULTILINE_CATEGORIES.has(entry.category);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, onPrev, onNext]);

  function handleEdit() {
    onClose();
    onEdit(entry);
  }

  const navBtnBase =
    "flex items-center justify-center w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors border border-emerald-500 disabled:border-none disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      {/* Desktop prev arrow */}
      {(onPrev || onNext) && (
        <button
          className={`hidden sm:flex absolute left-[max(0.25rem,calc(50%-375px))] z-10 ${navBtnBase}`}
          onClick={(e) => {
            e.stopPropagation();
            onPrev?.();
          }}
          disabled={!onPrev}
          aria-label="Previous entry">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
      {/* Desktop next arrow */}
      {(onPrev || onNext) && (
        <button
          className={`hidden sm:flex absolute right-[max(0.25rem,calc(50%-375px))] z-10 ${navBtnBase}`}
          onClick={(e) => {
            e.stopPropagation();
            onNext?.();
          }}
          disabled={!onNext}
          aria-label="Next entry">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
      <div
        className="w-full max-w-lg sm:max-w-2xl flex justify-between sm:block bg-white dark:bg-gray-800 sm:rounded-2xl sm:rounded-t-2xl shadow-xl flex flex-col h-[100vh] sm:h-auto sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>
        <div>
          {/* Header */}
          <div
            className={`flex flex-col items-start justify-between p-4 border-b border-gray-100 dark:border-gray-700  shadow-sm  rounded-none sm:rounded-t-2xl bg-gray-100 dark:bg-gray-700/50 relative`}>
            <div className="flex items-center gap-2 justify-between w-full">
              <span
                className={[
                  "inline-block px-2.5 py-0.5 rounded-full text-xs font-medium",
                  categoryColors[entry.category],
                ].join(" ")}>
                {t(`dashboard.categories.${entry.category}`)}
              </span>
              <div className="flex items-center gap-2">
                {/* Desktop-only: Practice */}
                <div className="hidden sm:flex flex items-center gap-2 shrink-0  ">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.includeInPractice ? t("entries.detail.inPractice") : t("entries.detail.notInPractice")}
                  </span>
                  <TbTargetArrow
                    className={[
                      "text-sm shrink-0",
                      entry.includeInPractice ? "text-green-500" : "text-gray-300 dark:text-gray-600",
                    ].join(" ")}
                  />
                </div>
                <SpeakButton text={entry.word} />
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="shrink-0 p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">{entry.word}</h2>
          </div>
          {/* Body */}
          {/* Explanation + Example (left) / Image (right) */}
          <div className="flex flex-col p-4 gap-4 overflow-y-auto sm:flex-row min-h-[60vh] sm:min-h-fit ">
            <div className="flex flex-col gap-5 flex-1 min-w-0">
              {entry.explanation && (
                <div>
                  <p className="text-sm sm:text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                    {t("entries.detail.explanation")}
                  </p>
                  <p
                    className={`text-base sm:text-sm text-gray-700 dark:text-gray-300 bg-emerald-100 dark:bg-emerald-900/50 font-bold leading-relaxed${isMultiline ? " whitespace-pre-wrap break-words" : ""}`}>
                    {entry.explanation}
                  </p>
                </div>
              )}
              {entry.example && (
                <div>
                  <p className="text-sm sm:text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                    {t("entries.detail.example")}
                  </p>
                  <p
                    className={`text-base sm:text-sm text-gray-600 dark:text-gray-400 italic border-l-2 border-emerald-200 dark:border-emerald-700 pl-3  leading-relaxed whitespace-pre-wrap break-words`}>
                    {entry.example}
                  </p>
                </div>
              )}
            </div>
            {entry.img && (
              <EntryImage
                src={getEntryImageUrl(entry.img)}
                alt={entry.word}
                className={`w-48 h-48 shrink-0 mx-auto sm:m-auto`}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div>
          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex items-start justify-between p-2 border-t border-gray-100 dark:border-gray-700  bg-gray-50 dark:bg-gray-700/50 sm:bg-transparent sm:dark:bg-transparent sm:border-0 sm:rounded-b-2xl">
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="text-sm sm:text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    #{tag.name}
                  </span>
                ))}
              </div>{" "}
            </div>
          )}
          {/* Mobile-only: DualRating + Practice above tags */}
          <div className="sm:hidden flex items-center justify-between gap-4 px-4 py-1 border-t border-gray-100 dark:border-gray-700  bg-gray-50 dark:bg-gray-700/50">
            <DualRating confidenceRating={entry.rating} masteryLevel={entry.mastery_level} />
            <div className=" ">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-base sm:text-sm text-gray-600 dark:text-gray-400">
                  {entry.includeInPractice ? t("entries.detail.inPractice") : t("entries.detail.notInPractice")}
                </span>
                <TbTargetArrow
                  className={[
                    "text-base sm:text-sm shrink-0",
                    entry.includeInPractice ? "text-green-500" : "text-gray-300 dark:text-gray-600",
                  ].join(" ")}
                />
              </div>{" "}
              <p className="text-xs text-gray-300 dark:text-gray-600">
                {t("entries.detail.added")}{" "}
                {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex justify-between gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-100 sm:bg-gray-50 dark:bg-gray-700/50 sm:rounded-b-2xl shadow-sm">
            {/* Desktop-only: DualRating + Date added*/}{" "}
            <div className="hidden sm:flex items-center justify-between w-full">
              <DualRating
                confidenceRating={entry.rating}
                masteryLevel={entry.mastery_level}
                showAutoRating={entry.includeInPractice}
              />
              <p className="text-xs text-gray-300 dark:text-gray-600">
                {t("entries.detail.added")}{" "}
                {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {/* Mobile: prev/next arrows */}
            {(onPrev || onNext) && (
              <div className="flex sm:hidden gap-2">
                <button className={navBtnBase} onClick={onPrev} disabled={!onPrev} aria-label="Previous entry">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button className={navBtnBase} onClick={onNext} disabled={!onNext} aria-label="Next entry">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>
                {t("entries.detail.close")}
              </Button>
              <Button onClick={handleEdit}>{t("entries.detail.edit")}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
