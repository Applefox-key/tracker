import { useTranslation } from "react-i18next";
import { RatingMultiSelect } from "@/shared/ui/RatingMultiSelect";
import type { EntryCategory, EntryTag } from "@/features/entries/types";

const CATEGORY_KEYS: EntryCategory[] = ["word", "phrase", "grammar", "idiom", "note"];

const btnBase = "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors";
const active = "bg-emerald-600 text-white border-emerald-600";
const inactive = "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";

interface Props {
  allTags: EntryTag[];
  selectedCategory: EntryCategory | null;
  onCategoryChange: (c: EntryCategory | null) => void;
  selectedTag: number | null;
  onTagChange: (t: number | null) => void;
  selectedRatings: number[];
  onRatingsChange: (r: number[]) => void;
}

export function PracticeFilterPanel({
  allTags,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  selectedRatings,
  onRatingsChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
      <div className="flex items-start gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 pt-1.5 shrink-0 w-16">
          {t("practice.filterPanel.rating")}
        </span>
        <RatingMultiSelect selected={selectedRatings} onChange={onRatingsChange} />
      </div>

      <div className="flex items-start gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 pt-1.5 shrink-0 w-16">
          {t("practice.filterPanel.category")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => onCategoryChange(null)}
            className={[btnBase, selectedCategory === null ? active : inactive].join(" ")}>
            {t("practice.filterPanel.all")}
          </button>
          {CATEGORY_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => onCategoryChange(selectedCategory === key ? null : key)}
              className={[btnBase, selectedCategory === key ? active : inactive].join(" ")}>
              {t(`dashboard.categories.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 pt-1 shrink-0 w-16">
            {t("practice.filterPanel.tag")}
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onTagChange(selectedTag === tag.id ? null : tag.id)}
                className={[
                  "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  selectedTag === tag.id
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:text-emerald-600",
                ].join(" ")}>
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
