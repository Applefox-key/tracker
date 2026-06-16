import { Entry } from "../types";
import { MULTILINE_CATEGORIES } from "../constants";
import { useEntryCrud } from "@/hooks/useEntryCrud";
import { Button } from "@/shared/ui/Button";
import { RatingStars } from "@/shared/ui/RatingStars";
import { ToggleSwitch } from "@/shared/ui/ToggleSwitch";
import { EntryImage } from "@/shared/ui/EntryImage";
import { getEntryImageUrl } from "@/api/api";

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
  const { updateEntry } = useEntryCrud();
  const isMultiline = MULTILINE_CATEGORIES.has(entry.category);

  return (
    <div
      className={`relative dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer justify-between ${categoryColorsCard[entry.category]}`}
      onClick={() => onView(entry)}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
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
            "shrink-0 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
            categoryColors[entry.category],
          ].join(" ")}>
          {entry.category}
        </span>
      </div>{" "}
      {/* Content row */}{" "}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className={`flex flex-col items-start ${entry.img ? "justify-start" : "justify-between"} gap-3 h-full`}>
          <p
            className={`text-sm text-gray-500 dark:text-gray-400 mt-0.5 ${isMultiline ? "line-clamp-2 break-words" : ""}`}>
            {entry.explanation}
          </p>
          {/* Example */}
          {entry.example && (
            <p
              className={`text-sm text-gray-600 dark:text-gray-400 italic border-l-2 border-gray-400 dark:border-gray-200 pl-3${isMultiline ? " line-clamp-3 break-words" : ""}`}>
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
            className="shrink-0"
          />
        )}
      </div>
      {/* Footer row — stop propagation so clicks here don't open detail view */}
      <div
        className="flex flex-wrap flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:gap-3"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 justify-between">
          <RatingStars value={entry.rating} onChange={(v) => updateEntry(entry.id, { rating: v })} />
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 shrink-0" />
          <ToggleSwitch
            checked={entry.includeInPractice}
            onChange={(v) => updateEntry(entry.id, { includeInPractice: v })}
            label="Practice"
          />{" "}
        </div>

        <div className="flex gap-1 ml-auto shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(entry)}
            className="text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(entry.id)}
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
