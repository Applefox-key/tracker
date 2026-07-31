import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Entry } from "../types";
import { MULTILINE_CATEGORIES } from "../constants";
import { useEntryCrud } from "@/hooks/useEntryCrud";
import { Button } from "@/shared/ui/Button";
import { DualRating } from "@/shared/ui/DualRating";
import { ToggleSwitch } from "@/shared/ui/ToggleSwitch";
import { EntryImage } from "@/shared/ui/EntryImage";
import { getEntryImageUrl } from "@/api/api";
import { TbTargetArrow } from "react-icons/tb";
import { FaCrown } from "react-icons/fa6";

const categoryColors: Record<Entry["category"], string> = {
  word: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-auto",
  phrase: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  grammar: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  idiom: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  note: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};
const categoryColorsCard: Record<Entry["category"], string> = {
  word: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-400",
  phrase: "bg-green-50 dark:bg-green-900/30  border-green-200 dark:border-green-400",
  grammar: "bg-purple-50 dark:bg-purple-900/30  border-purple-200 dark:border-purple-400",
  idiom: "bg-orange-50 dark:bg-orange-900/30  border-orange-200 dark:border-orange-400",
  note: "bg-teal-50 dark:bg-teal-900/30  border-teal-200 dark:border-teal-400",
};

interface EntryCardProps {
  entry: Entry;
  onRemove: (id: number) => void;
  onEdit: (entry: Entry) => void;
  onView: (entry: Entry) => void;
}

export function EntryCard({ entry, onRemove, onEdit, onView }: EntryCardProps) {
  const { t } = useTranslation();
  const { updateEntry } = useEntryCrud();
  const isMultiline = MULTILINE_CATEGORIES.has(entry.category);
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
      didLongPress.current = true;
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    if (showActions) {
      setShowActions(false);
      return;
    }
    onView(entry);
  };

  return (
    <div
      // className={`group relative dark:bg-gray-800 rounded-xl border pb-1 sm:pb-5 flex flex-col gap-3 transition-shadow cursor-pointer justify-between select-none ${categoryColorsCard[entry.category]} `}
      className={`group relative dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm pb-1 sm:pb-5 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer justify-between select-none ${categoryColorsCard[entry.category]} `}
      style={
        entry.mastery_level === 5
          ? { boxShadow: "0 0 0 0 transparent, 0 4px 16px 0 rgba(251,191,36,0.18), 0 1px 3px 0 rgba(0,0,0,0.07)" }
          : undefined
      }
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      // onContextMenu={(e) => e.preventDefault()}
      onClick={handleClick}>
      {/* Mastered corner fold */}
      {entry.mastery_level === 5 && (
        <>
          <div className="absolute top-[-1px] left-[-1px] w-12 h-12 rounded-tl-md z-10 pointer-events-none">
            <div className="absolute inset-0 bg-amber-400  rounded-tl-md [clip-path:polygon(0_0,100%_0,0_100%)]" />
            <div className="absolute inset-0  border-t-[1px] border-l-[1px] border-amber-400  rounded-tl-md bg-gradient-to-bl from-amber-100 to-amber-400 [clip-path:polygon(0_0,calc(100%_-_1px)_0,0_calc(100%_-_1px))]" />
          </div>
          <FaCrown
            className="absolute top-2 left-1.5 z-10 text-[0.9rem] text-amber-400 pointer-events-none"
            stroke="#89651d"
            strokeWidth="30"
          />
        </>
      )}
      {/* Header row */}
      <div
        className={`flex items-start justify-between p-5 pb-4 gap-3  rounded-t-xl ${categoryColors[entry.category]} ${entry.mastery_level === 5 ? "ps-7" : ""}`}>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{entry.word}</p>
        </div>{" "}
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1 absolute top-10 right-5">
          {new Date(entry.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        <span
          className={[
            "shrink-0 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium",
            categoryColors[entry.category],
          ].join(" ")}>
          {t(`dashboard.categories.${entry.category}`)}
        </span>
      </div>{" "}
      {/* Content row */}{" "}
      <div className="flex flex-col sm:flex-row px-5 items-start sm:items-center gap-3 justify-between">
        <div className={`flex flex-col items-start ${entry.img ? "justify-start" : "justify-between"} gap-3 h-full`}>
          <p
            className={`text-sm text-gray-500 dark:text-gray-400 mt-0.5 whitespace-pre-line font-bold ${isMultiline ? "line-clamp-2 break-words" : ""}`}>
            {entry.explanation}
          </p>
          {/* Example */}
          {entry.example && (
            <p
              className={`text-sm text-gray-600 dark:text-gray-400 italic border-l-2 border-gray-400 dark:border-gray-200 whitespace-pre-line pl-3${isMultiline ? " line-clamp-3 break-words" : ""}`}>
              {entry.example}
            </p>
          )}{" "}
          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
        {entry.img && (
          <EntryImage
            src={getEntryImageUrl(entry.img)}
            alt={entry.word}
            style={{ width: 150, height: 150, objectFit: "cover" }}
            className="shrink-0 m-auto"
          />
        )}
      </div>
      {/* Footer row — stop propagation so clicks here don't open detail view */}
      <div
        className="flex flex-col gap-1 sm:gap-2 pt-1 px-5 sm:flex-row sm:items-start sm:justify-between"
        onClick={(e) => e.stopPropagation()}>
        {/* DualRating + ToggleSwitch visible only on mobile */}
        <div className="flex items-center gap-3 justify-between">
          <DualRating
            confidenceRating={entry.rating}
            masteryLevel={entry.mastery_level}
            onConfidenceChange={(v) => updateEntry(entry.id, { rating: v })}
          />
          <div className="sm:hidden">
            <ToggleSwitch
              checked={entry.includeInPractice}
              onChange={(v) => updateEntry(entry.id, { includeInPractice: v })}
              label={t("entries.card.practice")}
              icon={<TbTargetArrow />}
            />
          </div>
        </div>

        {/* Desktop: ToggleSwitch above Edit/Remove in a right-aligned column */}
        <div className="flex flex-col items-end gap-1">
          <div className="hidden sm:block">
            <ToggleSwitch
              checked={entry.includeInPractice}
              onChange={(v) => updateEntry(entry.id, { includeInPractice: v })}
              label={t("entries.card.practice")}
              icon={<TbTargetArrow />}
            />
          </div>
          <div
            className={`flex gap-1 justify-center sm:justify-end border-t border-gray-100 dark:border-gray-700 sm:border-none w-full sm:w-auto transition-opacity sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto ${showActions ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(entry)}
              className="text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
              {t("entries.card.edit")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(entry.id)}
              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              {t("entries.card.remove")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
