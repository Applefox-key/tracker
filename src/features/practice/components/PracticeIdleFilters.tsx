import { useTranslation } from "react-i18next";
import { PracticeFilterPanel } from "./PracticeFilterPanel";
import type { EntryCategory } from "@/features/entries/types";
import type { PracticeFilterState } from "../hooks/usePracticeFilters";

interface Props {
  filterState: PracticeFilterState;
  allowedCategories?: EntryCategory[];
}

export function PracticeIdleFilters({ filterState, allowedCategories }: Props) {
  const { t } = useTranslation();
  const { filterPanelProps, activeFilterCount, clearFilters } = filterState;

  return (
    <div className="sm:hidden w-full border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          {t("practice.filters")}
          {activeFilterCount > 0 && (
            <span className="ml-1.5 text-emerald-600 dark:text-emerald-400">({activeFilterCount})</span>
          )}
        </span>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">
            {t("practice.clearFilters")}
          </button>
        )}
      </div>
      <PracticeFilterPanel {...filterPanelProps} allowedCategories={allowedCategories} inDrawer headerLine />
    </div>
  );
}
