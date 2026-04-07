import { useEffect } from "react";
import { Entry } from "../types";
import { MULTILINE_CATEGORIES } from "../constants";
import { Button } from "@/shared/ui/Button";
import { RatingStars } from "@/shared/ui/RatingStars";

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
}

export function EntryDetailModal({ entry, onClose, onEdit }: EntryDetailModalProps) {
  const isMultiline = MULTILINE_CATEGORIES.has(entry.category);
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleEdit() {
    onClose();
    onEdit(entry);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-800 sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[92vh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">{entry.word}</h2>
            <span
              className={[
                "inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                categoryColors[entry.category],
              ].join(" ")}>
              {entry.category}
            </span>
          </div>
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

        {/* Body */}
        <div className="flex flex-col gap-5 p-6 overflow-y-auto">
          {entry.explanation && (
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Explanation</p>
              <p className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed${isMultiline ? " whitespace-pre-wrap break-words" : ""}`}>
                {entry.explanation}
              </p>
            </div>
          )}

          {entry.example && (
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Example</p>
              <p className={`text-sm text-gray-600 dark:text-gray-400 italic border-l-2 border-emerald-200 dark:border-emerald-700 pl-3 leading-relaxed${isMultiline ? " whitespace-pre-wrap break-words" : ""}`}>
                {entry.example}
              </p>
            </div>
          )}

          {entry.tags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <span key={tag.id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    #{tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Rating</p>
            <RatingStars value={entry.rating} readOnly />
          </div>

          <div className="flex items-center gap-2">
            <span
              className={[
                "w-2 h-2 rounded-full shrink-0",
                entry.includeInPractice ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600",
              ].join(" ")}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {entry.includeInPractice ? "Included in practice" : "Not in practice"}
            </span>
          </div>

          <p className="text-xs text-gray-300 dark:text-gray-600">
            Added{" "}
            {new Date(entry.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleEdit}>Edit</Button>
        </div>
      </div>
    </div>
  );
}
