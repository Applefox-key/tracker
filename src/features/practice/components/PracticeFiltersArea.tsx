import { useTranslation } from "react-i18next";
import { TfiPanel } from "react-icons/tfi";
import { SideDrawer } from "@/shared/ui/SideDrawer";
import { PracticeFilterPanel } from "./PracticeFilterPanel";
import type { EntryCategory } from "@/features/entries/types";
import type { PracticeFilterState } from "../hooks/usePracticeFilters";

interface Props {
  filterState: PracticeFilterState;
  allowedCategories?: EntryCategory[];
  avaliableEntriesCount?: number | null;
}

export function PracticeFiltersArea({ filterState, allowedCategories, avaliableEntriesCount = null }: Props) {
  const { t } = useTranslation();
  const { filterPanelProps, showFilters, isMobileDrawerOpen, setIsMobileDrawerOpen, activeFilterCount, clearFilters } =
    filterState;
  const subtitle =
    avaliableEntriesCount === null ? "" : ` ${t("practice.entriesAvailable", { count: avaliableEntriesCount })}`;
  const title = t("practice.filters") + (activeFilterCount > 0 ? ` (${activeFilterCount})` : "");

  return (
    <>
      {showFilters && (
        <div className="hidden sm:block">
          <PracticeFilterPanel {...filterPanelProps} allowedCategories={allowedCategories} />
        </div>
      )}
      <SideDrawer
        open={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onOpen={() => setIsMobileDrawerOpen(true)}
        tabLabel={t("practice.filters")}
        tabIcon={<TfiPanel className="text-xl" />}
        title={title}
        subtitle={subtitle}
        hasActiveIndicator={activeFilterCount > 0}
        headerAction={
          activeFilterCount > 0 ? (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 font-medium">
              {t("practice.clearFilters")}
            </button>
          ) : undefined
        }>
        <PracticeFilterPanel {...filterPanelProps} allowedCategories={allowedCategories} inDrawer />
      </SideDrawer>
    </>
  );
}
