import { useTranslation } from "react-i18next";
import { RatingMultiSelect } from "@/shared/ui/RatingMultiSelect";
import type { EntryCategory, EntryTag } from "@/features/entries/types";

const CATEGORY_KEYS: EntryCategory[] = ["word", "phrase", "grammar", "idiom", "note"];

const active = "bg-emerald-600 text-white border-emerald-600";
const inactive = "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";
const tagInactive = "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:text-emerald-600";

interface Props {
  allTags: EntryTag[];
  selectedCategory: EntryCategory | null;
  onCategoryChange: (c: EntryCategory | null) => void;
  selectedTag: number | null;
  onTagChange: (t: number | null) => void;
  selectedRatings: number[];
  onRatingsChange: (r: number[]) => void;
  inDrawer?: boolean;
}

export function PracticeFilterPanel({
  allTags,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  selectedRatings,
  onRatingsChange,
  inDrawer = false,
}: Props) {
  const { t } = useTranslation();

  const labelCls = inDrawer
    ? "text-sm font-medium text-gray-500 dark:text-gray-400"
    : "text-xs font-medium text-gray-500 dark:text-gray-400 pt-1.5 shrink-0 w-16";
  const btnBase = inDrawer
    ? "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
    : "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors";
  const tagBtn = inDrawer
    ? "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
    : "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors";
  const sectionCls = inDrawer ? "flex flex-col gap-2" : "flex items-start gap-2 flex-wrap";
  const groupCls = inDrawer ? "flex gap-2 flex-wrap" : "flex gap-1.5 flex-wrap";

  const content = (
    <>
      <div className={sectionCls}>
        <span className={labelCls}>{t("practice.filterPanel.rating")}</span>
        <RatingMultiSelect selected={selectedRatings} onChange={onRatingsChange} large={inDrawer} />
      </div>

      <div className={sectionCls}>
        <span className={labelCls}>{t("practice.filterPanel.category")}</span>
        <div className={groupCls}>
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
        <div className={sectionCls}>
          <span className={labelCls}>{t("practice.filterPanel.tag")}</span>
          <div className={groupCls}>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onTagChange(selectedTag === tag.id ? null : tag.id)}
                className={[tagBtn, selectedTag === tag.id ? active : tagInactive].join(" ")}>
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (inDrawer) return <div className="flex flex-col gap-4">{content}</div>;

  return (
    <div className="flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
      {content}
    </div>
  );
}
