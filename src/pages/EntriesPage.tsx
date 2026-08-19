import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/Button";
import { RatingMultiSelect } from "@/shared/ui/RatingMultiSelect";
import { RatingStars } from "@/shared/ui/RatingStars";
import { SideDrawer } from "@/shared/ui/SideDrawer";
import { EntryCard } from "@/features/entries/components/EntryCard";
import { EntryForm, EntryFormValues } from "@/features/entries/components/AddEntryForm";
import { EditEntryModal } from "@/features/entries/components/EditEntryModal";
import { EntryDetailModal } from "@/features/entries/components/EntryDetailModal";
import { ImportBundleModal } from "@/features/entries/components/ImportBundleModal";
import { useEntries, DateFilter, PracticeFilter } from "@/features/entries/hooks/useEntries";
import { Entry, EntryCategory } from "@/features/entries/types";
import { TbTargetArrow, TbCrown } from "react-icons/tb";
import { AddEntryFab } from "@/features/entries/components/AddEntryFab";
import { TfiPanel } from "react-icons/tfi";

export function EntriesPage() {
  const { t } = useTranslation();

  const CATEGORIES: Array<{ value: EntryCategory | "all"; label: string }> = [
    { value: "all", label: t("entries.all") },
    { value: "word", label: t("dashboard.categories.word") },
    { value: "phrase", label: t("dashboard.categories.phrase") },
    { value: "grammar", label: t("dashboard.categories.grammar") },
    { value: "idiom", label: t("dashboard.categories.idiom") },
    { value: "note", label: t("dashboard.categories.note") },
  ];

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<Entry | null>(null);
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState<Entry | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"expanded" | "collapsed">("expanded");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  const initialDateFilter = (location.state?.dateFilter as DateFilter) ?? "all";
  const initialCategoryFilter = (location.state?.categoryFilter as EntryCategory | "all") ?? "all";
  const initialMasteredOnly = (location.state?.masteredOnly as boolean) ?? false;

  useEffect(() => {
    if (location.state?.openCreateForm) {
      setShowForm(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const {
    entries,
    totalCount,
    allTags,
    search,
    setSearch,
    filterCategory,
    setFilterCategory,
    selectedTag,
    setSelectedTag,
    selectedRatings,
    setSelectedRatings,
    dateFilter,
    setDateFilter,
    masteredOnly,
    setMasteredOnly,
    practiceFilter,
    setPracticeFilter,
    hasActiveFilters,
    clearFilters,
    addEntry,
    removeEntry,
  } = useEntries(initialDateFilter, initialCategoryFilter, initialMasteredOnly);

  const advancedFilterCount = [
    filterCategory !== "all",
    selectedTag !== null,
    selectedRatings.length > 0,
    dateFilter !== "all",
    masteredOnly,
    practiceFilter !== "all",
  ].filter(Boolean).length;

  function handleAdd(values: EntryFormValues) {
    const { tagIds, imgFile, removeImg: _, ...entryData } = values;
    addEntry({ ...entryData, tags: [] }, tagIds, imgFile ?? undefined);
    setShowForm(false);
  }

  const filterBtnInactive =
    "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";
  const filterBtnActive = "bg-emerald-600 text-white border-emerald-600";

  return (
    <div className="flex flex-col sm:flex-row gap-6 pb-10 sm:pb-0 max-w-7xl 3xl:max-w-[2000px] m-auto items-start">
      {/* ===== DESKTOP LEFT SIDEBAR ===== */}
      <aside className="hidden sm:flex flex-col gap-4 w-[22rem] 3xl:w-[23rem] shrink-0 sticky top-20">
        {/* Title + subtitle */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("entries.title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("entries.subtitle", { count: totalCount })}</p>
        </div>

        {/* Filter panel */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-emerald-600 px-4 py-2.5 flex items-center justify-between">
            <span className="text-white font-semibold text-sm">{t("entries.filters")}</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-emerald-100 hover:text-white font-medium transition-colors">
                {t("entries.clearAll")}
              </button>
            )}
          </div>
          <div className="p-4 flex flex-col gap-4 max-h-[calc(100vh-14rem)] overflow-y-auto [scrollbar-width:thin]">
            <AdvancedFiltersPanel
              allTags={allTags}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              selectedRatings={selectedRatings}
              setSelectedRatings={setSelectedRatings}
              masteredOnly={masteredOnly}
              setMasteredOnly={setMasteredOnly}
              practiceFilter={practiceFilter}
              setPracticeFilter={setPracticeFilter}
              filterBtnActive={filterBtnActive}
              sidebar
            />
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Sticky bar */}
        <div className="sticky top-16 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 bg-white dark:bg-gray-900 flex flex-col gap-2 pb-3 sm:-mt-8 sm:pt-8">
          {/* Mobile: search box (mr-8 leaves space for SideDrawer tab) */}
          <div className="sm:hidden flex flex-col gap-2 p-3 mr-8 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("entries.searchPlaceholder")}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Desktop: search + category chips + Add Entry button */}
          <div className="hidden sm:flex items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("entries.searchPlaceholder")}
              className="w-48 shrink-0 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <div className="flex gap-1.5 flex-1 flex-wrap items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilterCategory(value)}
                  className={[
                    "shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                    filterCategory === value ? filterBtnActive : filterBtnInactive,
                  ].join(" ")}>
                  {label}
                </button>
              ))}
            </div>
            {/* Add Entry split button */}
            <div className="relative shrink-0 flex" ref={addMenuRef}>
              <button
                onClick={() => {
                  if (!showForm) window.scrollTo({ top: 0, behavior: "smooth" });
                  setShowForm((v) => !v);
                  setShowAddMenu(false);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-l-lg font-medium px-4 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500">
                {showForm ? t("entries.cancel") : t("entries.addEntry")}
              </button>
              <button
                onClick={() => setShowAddMenu((v) => !v)}
                aria-label={t("entries.importBundle.menuAriaLabel")}
                className="inline-flex items-center justify-center px-2 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors rounded-r-lg border-l border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>
              {showAddMenu && (
                <div className="absolute right-0 top-full mt-1.5 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden min-w-[160px]">
                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      setShowImportModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-left">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    {t("entries.addBundle")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Entry count + view toggle */}
          <div className="flex items-center justify-between px-1 sm:px-0">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t("entries.showing", { shown: entries.length, total: totalCount })}
            </p>
            <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => setViewMode("expanded")}
                title="Expanded view"
                className={[
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "expanded"
                    ? "bg-white dark:bg-gray-600 shadow-sm text-gray-700 dark:text-gray-100"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300",
                ].join(" ")}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("collapsed")}
                title="Compact view"
                className={[
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "collapsed"
                    ? "bg-white dark:bg-gray-600 shadow-sm text-gray-700 dark:text-gray-100"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300",
                ].join(" ")}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="4" width="18" height="4" rx="1" />
                  <rect x="3" y="11" width="18" height="4" rx="1" />
                  <rect x="3" y="18" width="18" height="4" rx="1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Active filters chips — mobile only (desktop sidebar shows active state visually) */}
        {hasActiveFilters && (
          <div className="sm:hidden flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-gray-500">{t("entries.activeLabel")}</span>
            {filterCategory !== "all" && (
              <ActiveChip label={filterCategory} onRemove={() => setFilterCategory("all")} />
            )}
            {selectedTag !== null && (
              <ActiveChip
                label={`#${allTags.find((t) => t.id === selectedTag)?.name ?? selectedTag}`}
                onRemove={() => setSelectedTag(null)}
              />
            )}
            {selectedRatings.length > 0 && (
              <ActiveChip
                label={`★ ${[...selectedRatings].sort((a, b) => a - b).join(", ")}`}
                onRemove={() => setSelectedRatings([])}
              />
            )}
            {dateFilter !== "all" && (
              <ActiveChip
                label={dateFilter === "today" ? t("entries.today") : t("entries.thisWeek")}
                onRemove={() => setDateFilter("all")}
              />
            )}
            {masteredOnly && <ActiveChip label={t("entries.masteredOnly")} onRemove={() => setMasteredOnly(false)} />}
            {practiceFilter !== "all" && (
              <ActiveChip
                label={t(practiceFilter === "inPractice" ? "entries.inPractice" : "entries.notInPractice")}
                onRemove={() => setPracticeFilter("all")}
              />
            )}
            {search !== "" && <ActiveChip label={`"${search}"`} onRemove={() => setSearch("")} />}
            <button onClick={clearFilters} className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium">
              {t("entries.clearAll")}
            </button>
          </div>
        )}

        {/* Add form — mobile: full-screen modal; desktop: inline */}
        {showForm && (
          <div className="fixed inset-0 z-[52] overflow-y-auto bg-white dark:bg-gray-900 sm:static sm:inset-auto sm:z-auto sm:overflow-visible sm:bg-transparent dark:sm:bg-transparent">
            <EntryForm mode="create" onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {/* Entry list */}
        {entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-lg">{t("entries.noMatch")}</p>
            <p className="text-sm mt-1">
              {t("entries.noMatchHint")}{" "}
              <button className="text-emerald-500 hover:underline" onClick={clearFilters}>
                {t("entries.noMatchClear")}
              </button>
            </p>
          </div>
        ) : viewMode === "expanded" ? (
          <div className="overflow-hidden grid grid-cols-1 sm:grid-cols-2 3xl:grid-cols-3 gap-4">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onRemove={(id) => setConfirmDeleteEntry(entries.find((e) => e.id === id) ?? null)}
                onEdit={setEditingEntry}
                onView={setViewingEntry}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {entries.map((entry) => (
              <EntryHeaderStrip key={entry.id} entry={entry} onView={setViewingEntry} />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {viewingEntry && (() => {
        const idx = entries.findIndex((e) => e.id === viewingEntry.id);
        return (
          <EntryDetailModal
            entry={viewingEntry}
            onClose={() => setViewingEntry(null)}
            onEdit={(entry) => {
              setViewingEntry(null);
              setEditingEntry(entry);
            }}
            onPrev={idx > 0 ? () => setViewingEntry(entries[idx - 1]) : undefined}
            onNext={idx < entries.length - 1 ? () => setViewingEntry(entries[idx + 1]) : undefined}
          />
        );
      })()}

      {/* Edit modal */}
      {editingEntry && <EditEntryModal entry={editingEntry} onClose={() => setEditingEntry(null)} />}

      {/* Mobile filter sidebar */}
      {!viewingEntry && !editingEntry && (
        <SideDrawer
          open={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          onOpen={() => setIsMobileDrawerOpen(true)}
          tabLabel={t("entries.filters")}
          tabIcon={<TfiPanel className="text-xl" />}
          verticalPosition={"top-[77px]"}
          title={`${t("entries.filters")}${advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ""}`}
          hasActiveIndicator={advancedFilterCount > 0}
          headerAction={
            advancedFilterCount > 0 ? (
              <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 font-medium">
                {t("entries.clearFilters")}
              </button>
            ) : undefined
          }>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("entries.form.category")}</span>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilterCategory(value)}
                  className={[
                    "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                    filterCategory === value ? filterBtnActive : tagBtnInactive,
                  ].join(" ")}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <AdvancedFiltersPanel
            allTags={allTags}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            selectedRatings={selectedRatings}
            setSelectedRatings={setSelectedRatings}
            masteredOnly={masteredOnly}
            setMasteredOnly={setMasteredOnly}
            practiceFilter={practiceFilter}
            setPracticeFilter={setPracticeFilter}
            filterBtnActive={filterBtnActive}
            inDrawer
          />
        </SideDrawer>
      )}

      {/* FAB — mobile only, above bottom nav */}
      <AddEntryFab
        onClick={() => setShowForm((v) => !v)}
        isOpen={showForm}
        ariaLabel={showForm ? t("entries.cancel") : t("entries.addEntry")}
      />

      {/* Import bundle modal */}
      {showImportModal && <ImportBundleModal onClose={() => setShowImportModal(false)} />}

      {/* Delete confirmation */}
      {confirmDeleteEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setConfirmDeleteEntry(null)}>
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{t("entries.deleteTitle")}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="font-medium text-gray-700 dark:text-gray-200">"{confirmDeleteEntry.word}"</span>{" "}
                {t("entries.deletePermanent")}
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setConfirmDeleteEntry(null)}>
                {t("entries.cancel")}
              </Button>
              <Button
                onClick={() => {
                  removeEntry(confirmDeleteEntry.id);
                  setConfirmDeleteEntry(null);
                }}
                className="bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600 text-white">
                {t("entries.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const categoryColors: Record<EntryCategory, string> = {
  word: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  phrase: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  grammar: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  idiom: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  note: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

const headerAccent: Record<EntryCategory, string> = {
  word: "border-l-blue-400 dark:border-l-blue-500",
  phrase: "border-l-green-400 dark:border-l-green-500",
  grammar: "border-l-purple-400 dark:border-l-purple-500",
  idiom: "border-l-orange-400 dark:border-l-orange-500",
  note: "border-l-teal-400 dark:border-l-teal-500",
};

const masteryColors: Record<number, string> = {
  1: "bg-red-400",
  2: "bg-orange-400",
  3: "bg-yellow-400",
  4: "bg-blue-400",
  5: "bg-emerald-400",
};

function EntryHeaderStrip({ entry, onView }: { entry: Entry; onView: (e: Entry) => void }) {
  const { t } = useTranslation();
  return (
    <div
      className={[
        "flex items-center gap-3 px-4 py-3 cursor-pointer border-l-4 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0",
        "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
        "shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
        headerAccent[entry.category],
      ].join(" ")}
      onClick={() => onView(entry)}>
      <span
        className={`shrink-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-800 ${entry.mastery_level != null ? masteryColors[entry.mastery_level] : "bg-gray-300 dark:bg-gray-600"}`}
      />
      <span
        className={[
          "shrink-0 px-2 py-0.5 rounded-full text-xs font-medium hidden sm:inline-block",
          categoryColors[entry.category],
        ].join(" ")}>
        {t(`dashboard.categories.${entry.category}`)}
      </span>
      <p className="flex-1 min-w-0 font-semibold text-gray-900 dark:text-gray-100 truncate">{entry.word}</p>
      {entry.mastery_level === 5 && <TbCrown className="shrink-0 text-emerald-400 text-base" title="Mastered" />}
      <RatingStars value={entry.rating} readOnly />
      <p className="shrink-0 text-xs text-gray-400 dark:text-gray-500 hidden sm:block tabular-nums">
        {new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </p>{" "}
      <TbTargetArrow
        className={[
          "text-sm shrink-0",
          entry.includeInPractice ? "text-green-500" : "text-gray-300 dark:text-gray-600",
        ].join(" ")}
      />
    </div>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-emerald-900 dark:hover:text-emerald-200 leading-none focus:outline-none"
        aria-label={`Remove ${label} filter`}>
        ✕
      </button>
    </span>
  );
}

const tagBtnInactive =
  "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:text-emerald-600";

interface AdvancedFiltersPanelProps {
  allTags: { id: number; name: string }[];
  selectedTag: number | null;
  setSelectedTag: (id: number | null) => void;
  dateFilter: DateFilter;
  setDateFilter: (f: DateFilter) => void;
  selectedRatings: number[];
  setSelectedRatings: (r: number[]) => void;
  masteredOnly: boolean;
  setMasteredOnly: (v: boolean) => void;
  practiceFilter: PracticeFilter;
  setPracticeFilter: (v: PracticeFilter) => void;
  filterBtnActive: string;
  inDrawer?: boolean;
  sidebar?: boolean;
}

function AdvancedFiltersPanel({
  allTags,
  selectedTag,
  setSelectedTag,
  dateFilter,
  setDateFilter,
  selectedRatings,
  setSelectedRatings,
  masteredOnly,
  setMasteredOnly,
  practiceFilter,
  setPracticeFilter,
  filterBtnActive,
  inDrawer,
  sidebar,
}: AdvancedFiltersPanelProps) {
  const { t } = useTranslation();
  const labelCls = sidebar
    ? "text-xs 3xl:text-sm font-medium text-gray-500 dark:text-gray-400"
    : inDrawer
      ? "text-sm font-medium text-gray-500 dark:text-gray-400"
      : "text-xs font-medium text-gray-500 dark:text-gray-400";
  const btnCls = sidebar
    ? "px-2.5 py-1 3xl:py-1.5 rounded-full text-xs 3xl:text-sm font-medium border transition-colors"
    : inDrawer
      ? "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
      : "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors";
  const gapCls = sidebar ? "gap-2" : inDrawer ? "gap-2" : "gap-1.5";
  const sectionGap = sidebar ? "gap-2" : inDrawer ? "gap-2" : "gap-1.5";
  return (
    <>
      <div className={`flex flex-col ${sectionGap}`}>
        <span className={labelCls}>{t("entries.dateLabel")}</span>
        <div className={`flex ${gapCls} flex-wrap`}>
          {(
            [
              { value: "today", label: t("entries.today") },
              { value: "week", label: t("entries.thisWeek") },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setDateFilter(dateFilter === value ? "all" : value)}
              className={[btnCls, dateFilter === value ? filterBtnActive : tagBtnInactive].join(" ")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex flex-col ${sectionGap}`}>
        <span className={labelCls}>{t("entries.ratingLabel")}</span>
        <RatingMultiSelect selected={selectedRatings} onChange={setSelectedRatings} large={inDrawer && !sidebar} />
      </div>

      <div className={`flex flex-col ${sectionGap}`}>
        <span className={labelCls}>{t("entries.masteredLabel")}</span>
        <div className={`flex ${gapCls} flex-wrap`}>
          <button
            onClick={() => setMasteredOnly(!masteredOnly)}
            className={[btnCls, masteredOnly ? filterBtnActive : tagBtnInactive].join(" ")}>
            {t("entries.masteredOnly")}
          </button>
        </div>
      </div>

      <div className={`flex flex-col ${sectionGap}`}>
        <span className={labelCls}>{t("entries.practiceLabel")}</span>
        <div className={`flex ${gapCls} flex-wrap`}>
          {(
            [
              { value: "inPractice", label: t("entries.inPractice") },
              { value: "notInPractice", label: t("entries.notInPractice") },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPracticeFilter(practiceFilter === value ? "all" : value)}
              className={[btnCls, practiceFilter === value ? filterBtnActive : tagBtnInactive].join(" ")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {allTags.length > 0 && (
        <div className={`flex flex-col ${sectionGap}`}>
          <span className={labelCls}>{t("entries.tagLabel")}</span>
          <div className={`flex ${gapCls} flex-wrap`}>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                className={[btnCls, selectedTag === tag.id ? filterBtnActive : tagBtnInactive].join(" ")}>
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
