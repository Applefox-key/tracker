import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/Button";
import { RatingMultiSelect } from "@/shared/ui/RatingMultiSelect";
import { EntryCard } from "@/features/entries/components/EntryCard";
import { EntryForm } from "@/features/entries/components/AddEntryForm";
import { EditEntryModal } from "@/features/entries/components/EditEntryModal";
import { EntryDetailModal } from "@/features/entries/components/EntryDetailModal";
import { useEntries } from "@/features/entries/hooks/useEntries";
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

  const location = useLocation();
  const navigate = useNavigate();

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
    hasActiveFilters,
    clearFilters,
    addEntry,
    removeEntry,
  } = useEntries();

  const advancedFilterCount = [
    selectedTag !== null,
    selectedRatings.length > 0,
  ].filter(Boolean).length;

  function handleAdd(values: Parameters<typeof addEntry>[0]) {
    addEntry(values);
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
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add Entry"}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <EntryForm
          mode="create"
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* ── Filter section ── */}
      <div className="flex flex-col gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">

        {/* Row 1: search + category */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search word or explanation..."
            className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap">
            {CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterCategory(value)}
                className={[
                  "shrink-0 px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                  filterCategory === value
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: filters toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFiltersOpen((v) => !v)}
            className={[
              "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
              isFiltersOpen
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
            ].join(" ")}
          >
            Filters{advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ""}
            <span className="text-xs ml-1">{isFiltersOpen ? "▲" : "▼"}</span>
          </button>
        </div>

        {/* Row 3: advanced filters (collapsible) */}
        {isFiltersOpen && (
          <>
            {allTags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-500 shrink-0">Tag:</span>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={[
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                      selectedTag === tag
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-500 border-gray-300 hover:border-indigo-400 hover:text-indigo-600",
                    ].join(" ")}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500">Select ratings:</span>
              <RatingMultiSelect
                selected={selectedRatings}
                onChange={setSelectedRatings}
              />
            </div>
          </>
        )}

        {/* Active filters + clear */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-200">
            <span className="text-xs text-gray-400">Active filters:</span>

            {filterCategory !== "all" && (
              <ActiveChip
                label={filterCategory}
                onRemove={() => setFilterCategory("all")}
              />
            )}
            {selectedTag !== null && (
              <ActiveChip
                label={`#${selectedTag}`}
                onRemove={() => setSelectedTag(null)}
              />
            )}
            {selectedRatings.length > 0 && (
              <ActiveChip
                label={`★ ${[...selectedRatings].sort((a, b) => a - b).join(", ")}`}
                onRemove={() => setSelectedRatings([])}
              />
            )}
            {search !== "" && (
              <ActiveChip
                label={`"${search}"`}
                onRemove={() => setSearch("")}
              />
            )}

            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Entry count */}
      <p className="text-sm text-gray-400 -mt-2">
        Showing {entries.length} of {totalCount} entries
      </p>

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
      ) : (
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
      )}

      {/* Detail modal */}
      {viewingEntry && (
        <EntryDetailModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
          onEdit={(entry) => { setViewingEntry(null); setEditingEntry(entry) }}
        />
      )}

      {/* Edit modal */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}

// ── Small internal chip component ──────────────────────────────────────────
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-indigo-900 leading-none focus:outline-none"
        aria-label={`Remove ${label} filter`}
      >
        ✕
      </button>
    </span>
  );
}
