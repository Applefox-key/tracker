import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/Button";
import { RatingMultiSelect } from "@/shared/ui/RatingMultiSelect";
import { RatingStars } from "@/shared/ui/RatingStars";
import { EntryCard } from "@/features/entries/components/EntryCard";
import { EntryForm, EntryFormValues } from "@/features/entries/components/AddEntryForm";
import { EditEntryModal } from "@/features/entries/components/EditEntryModal";
import { EntryDetailModal } from "@/features/entries/components/EntryDetailModal";
import { useEntries, DateFilter } from "@/features/entries/hooks/useEntries";
import { Entry, EntryCategory } from "@/features/entries/types";

const CATEGORIES: Array<{ value: EntryCategory | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "word", label: "Words" },
  { value: "phrase", label: "Phrases" },
  { value: "grammar", label: "Grammar" },
  { value: "idiom", label: "Idioms" },
  { value: "note", label: "Notes" },
];

export function EntriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<Entry | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"expanded" | "collapsed">("expanded");

  const location = useLocation();
  const navigate = useNavigate();

  const initialDateFilter = (location.state?.dateFilter as DateFilter) ?? 'all';

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
    hasActiveFilters,
    clearFilters,
    addEntry,
    removeEntry,
  } = useEntries(initialDateFilter);

  const advancedFilterCount = [selectedTag !== null, selectedRatings.length > 0, dateFilter !== 'all'].filter(Boolean).length;

  function handleAdd(values: EntryFormValues) {
    const { tagIds, ...entryData } = values;
    addEntry({ ...entryData, tags: [] }, tagIds);
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entries</h1>
          <p className="text-gray-500 mt-1">{totalCount} words &amp; phrases saved</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "+ Add Entry"}</Button>
      </div>

      {/* Add form */}
      {showForm && <EntryForm mode="create" onSubmit={handleAdd} onCancel={() => setShowForm(false)} />}

      {/* ── Filter section ── */}
      <div className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
        {/* Row 1: search + category chips + filters toggle */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="sm:w-48 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-400 shrink-0"
          />
          <div
            className="flex gap-1.5 flex-1 overflow-x-auto [scrollbar-width:none]
                          [&::-webkit-scrollbar]:hidden sm:flex-wrap items-center">
            {CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterCategory(value)}
                className={[
                  "shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                  filterCategory === value
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
                ].join(" ")}>
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsFiltersOpen((v) => !v)}
            className={[
              "shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
              isFiltersOpen || advancedFilterCount > 0
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
            ].join(" ")}>
            Filters{advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ""} {isFiltersOpen ? "▲" : "▼"}
          </button>
        </div>

        {/* Row 2: advanced filters */}
        {isFiltersOpen && (
          <div className="flex flex-col gap-3 pt-2 border-t border-gray-200">
            {allTags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-500 shrink-0">Tag:</span>
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                    className={[
                      "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                      selectedTag === tag.id
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-500 border-gray-300 hover:border-indigo-400 hover:text-indigo-600",
                    ].join(" ")}>
                    #{tag.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500 shrink-0">Date:</span>
              {([{ value: 'today', label: 'Today' }, { value: 'week', label: 'This week' }] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDateFilter(dateFilter === value ? 'all' : value)}
                  className={[
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                    dateFilter === value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-500 border-gray-300 hover:border-indigo-400 hover:text-indigo-600",
                  ].join(" ")}>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-start gap-3 flex-wrap">
              <span className="text-xs font-medium text-gray-500 shrink-0 pt-1.5">Rating:</span>
              <RatingMultiSelect selected={selectedRatings} onChange={setSelectedRatings} />
            </div>
          </div>
        )}

        {/* Active filters + clear */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1.5 border-t border-gray-200">
            <span className="text-xs text-gray-400">Active:</span>
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
            {dateFilter !== 'all' && (
              <ActiveChip
                label={dateFilter === 'today' ? 'Today' : 'This week'}
                onRemove={() => setDateFilter('all')}
              />
            )}
            {search !== "" && <ActiveChip label={`"${search}"`} onRemove={() => setSearch("")} />}
            <button onClick={clearFilters} className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Entry count + view toggle */}
      <div className="flex items-center justify-between -mt-2">
        <p className="text-sm text-gray-400">
          Showing {entries.length} of {totalCount} entries
        </p>
        <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
          <button
            onClick={() => setViewMode("expanded")}
            title="Expanded view"
            className={[
              "p-1.5 rounded-md transition-colors",
              viewMode === "expanded" ? "bg-white shadow-sm text-gray-700" : "text-gray-400 hover:text-gray-600",
            ].join(" ")}>
            {/* grid icon */}
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
              viewMode === "collapsed" ? "bg-white shadow-sm text-gray-700" : "text-gray-400 hover:text-gray-600",
            ].join(" ")}>
            {/* list icon */}
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
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Entry list */}
      {entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No entries match your filters</p>
          <p className="text-sm mt-1">
            Try adjusting your filters or{" "}
            <button className="text-indigo-500 hover:underline" onClick={clearFilters}>
              clear all
            </button>
          </p>
        </div>
      ) : viewMode === "expanded" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onRemove={removeEntry}
              onEdit={setEditingEntry}
              onView={setViewingEntry}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} onView={setViewingEntry} />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {viewingEntry && (
        <EntryDetailModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
          onEdit={(entry) => {
            setViewingEntry(null);
            setEditingEntry(entry);
          }}
        />
      )}

      {/* Edit modal */}
      {editingEntry && <EditEntryModal entry={editingEntry} onClose={() => setEditingEntry(null)} />}
    </div>
  );
}

const categoryColors: Record<EntryCategory, string> = {
  word: "bg-blue-100 text-blue-700",
  phrase: "bg-green-100 text-green-700",
  grammar: "bg-purple-100 text-purple-700",
  idiom: "bg-orange-100 text-orange-700",
  note: "bg-teal-100 text-teal-700",
};

function EntryRow({ entry, onView }: { entry: Entry; onView: (e: Entry) => void }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onView(entry)}>
      {/* Category dot */}
      <span
        className={[
          "shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize hidden sm:inline-block",
          categoryColors[entry.category],
        ].join(" ")}>
        {entry.category}
      </span>

      {/* Word */}
      <p className="flex-1 min-w-0 font-medium text-gray-900 truncate text-sm">{entry.word}</p>

      {/* In practice badge */}
      <span
        className={[
          "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full",
          entry.includeInPractice ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-400",
        ].join(" ")}
        title={entry.includeInPractice ? "In practice" : "Not in practice"}>
        {entry.includeInPractice ? "Practice" : "—"}
      </span>
      {/* Rating — read only */}
      <RatingStars value={entry.rating} readOnly />
      {/* Date */}
      <p className="shrink-0 text-xs text-gray-400 hidden sm:block tabular-nums">
        {new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </div>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-indigo-900 leading-none focus:outline-none"
        aria-label={`Remove ${label} filter`}>
        ✕
      </button>
    </span>
  );
}
