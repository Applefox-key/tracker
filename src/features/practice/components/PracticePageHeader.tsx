import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BackButton } from "@/shared/ui/BackButton";
import { Button } from "@/shared/ui/Button";
import { PracticeModeIndicator } from "@/shared/ui/PracticeModeIndicator";
import type { PracticeFilterState } from "../hooks/usePracticeFilters";

interface Props {
  title: string;
  onBack: () => void;
  backLabel?: string;
  onHelp?: () => void;
  showHelpBtn?: boolean;
  filterState?: PracticeFilterState;
  showFilterBtn?: boolean;
  children?: ReactNode;
}

export function PracticePageHeader({
  title,
  onBack,
  backLabel,
  onHelp,
  showHelpBtn = true,
  filterState,
  showFilterBtn = true,
  children,
}: Props) {
  const { t } = useTranslation();
  const showFilter = !!filterState && showFilterBtn;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
        {/* Left: back + title + help */}
        <div className="flex items-center  gap-3 min-w-0 pb-2 pt-2 sm:pt-[1rem]">
          <BackButton onClick={onBack} label={backLabel} />
          <div className="min-w-0">
            <div className="flex items-center  gap-1.5">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
              {onHelp && showHelpBtn && (
                <button
                  onClick={onHelp}
                  className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-full text-sm sm:text-xs font-bold w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 transition-colors mt-0.5">
                  ?
                </button>
              )}
              <PracticeModeIndicator small />
              {/* <div className="absolute top-0 sm:relative"></div> */}
            </div>
          </div>
        </div>

        {/* Right: game-specific actions + desktop filter toggle */}
        {(children || showFilter) && (
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap sm:flex-nowrap">
            {children}
            {children && showFilter && (
              <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-gray-600 shrink-0" />
            )}
            {showFilter && filterState && (
              <>
                <Button
                  variant={filterState.showFilters ? "primary" : "secondary"}
                  size="sm"
                  className="hidden sm:block"
                  onClick={() => filterState.setShowFilters((v) => !v)}>
                  {t("practice.filters")}
                  {filterState.activeFilterCount > 0 && <span className="ml-1">({filterState.activeFilterCount})</span>}
                  <span className="text-xs ml-1">{filterState.showFilters ? "▲" : "▼"}</span>
                </Button>
                {filterState.activeFilterCount > 0 && (
                  <button
                    onClick={filterState.clearFilters}
                    className="text-xs text-red-500 hover:text-red-700 font-medium">
                    {t("practice.clear")}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <hr className="border-gray-200 dark:border-gray-700" />
    </>
  );
}
