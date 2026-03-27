import { useState } from "react";

const LS_START_SIDE = "flashcard_start_side";
import { FlashCard } from "@/features/flashcards/components/FlashCard";
import { CardNavigation } from "@/features/flashcards/components/CardNavigation";
import { useFlashcards } from "@/features/flashcards/hooks/useFlashcards";
import { RatingMultiSelect } from "@/shared/ui/RatingMultiSelect";
import { RatingStars } from "@/shared/ui/RatingStars";
import { Button } from "@/shared/ui/Button";
import { EntryCategory } from "@/features/entries/types";
import { useEntryCrud } from "@/hooks/useEntryCrud";

const CATEGORIES: Array<{ key: EntryCategory; label: string }> = [
  { key: "word", label: "Words" },
  { key: "phrase", label: "Phrases" },
  { key: "grammar", label: "Grammar" },
  { key: "idiom", label: "Idioms" },
  { key: "note", label: "Notes" },
];

export function FlashcardsPage() {
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [startSide, setStartSide] = useState<"word" | "explanation">(() =>
    localStorage.getItem(LS_START_SIDE) === "explanation" ? "explanation" : "word",
  );

  function toggleStartSide() {
    const next = startSide === "word" ? "explanation" : "word";
    setStartSide(next);
    localStorage.setItem(LS_START_SIDE, next);
    reset();
  }

  const { updateEntry } = useEntryCrud();

  const { currentCard, currentIndex, total, progress, isFlipped, allTags, goNext, goPrev, flip, reset } = useFlashcards(
    { selectedRatings, selectedCategory, selectedTag },
  );

  const activeFilterCount = [selectedRatings.length > 0, selectedCategory !== null, selectedTag !== null].filter(
    Boolean,
  ).length;

  function clearFilters() {
    setSelectedRatings([]);
    setSelectedCategory(null);
    setSelectedTag(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Compact header block ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 shrink-0">Flashcards</h1>

        {/* Right side: rating + start side toggle + filters button */}
        <div className="flex items-center gap-3 sm:ml-auto">
          <RatingMultiSelect selected={selectedRatings} onChange={setSelectedRatings} />

          <div className="w-px h-4 bg-gray-200 shrink-0" />

          {/* Start side toggle */}
          <button
            onClick={toggleStartSide}
            title={
              startSide === "word"
                ? "Showing word first — click to show explanation first"
                : "Showing explanation first — click to show word first"
            }
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors bg-white text-gray-600 border-gray-300 hover:bg-gray-50">
            <span>{startSide === "word" ? "🔤" : "💬"}</span>
            <span className="hidden sm:inline">{startSide === "word" ? "Word first" : "Explanation first"}</span>
          </button>

          <div className="w-px h-4 bg-gray-200 shrink-0" />

          <Button variant={showFilters ? "primary" : "secondary"} size="sm" onClick={() => setShowFilters((v) => !v)}>
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">⚙</span>
            {activeFilterCount > 0 && <span className="ml-1">({activeFilterCount})</span>}
            <span className="text-xs ml-1">{showFilters ? "▲" : "▼"}</span>
          </Button>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-gray-200" />

      {/* ── Collapsible filters panel ────────────────────────────── */}
      {showFilters && (
        <div className="flex flex-col gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          {/* Category */}
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 pt-1.5 shrink-0 w-16">Category:</span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={[
                  "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                  selectedCategory === null
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
                ].join(" ")}>
                All
              </button>
              {CATEGORIES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                  className={[
                    "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                    selectedCategory === key
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
                  ].join(" ")}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tag */}
          {allTags.length > 0 && (
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500 pt-1 shrink-0 w-16">Tag:</span>
              <div className="flex gap-1.5 flex-wrap">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                    className={[
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                      selectedTag === tag.id
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-500 border-gray-300 hover:border-emerald-400 hover:text-emerald-600",
                    ].join(" ")}>
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Card area or empty state ─────────────────────────────── */}
      {!currentCard ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-center">
          <p className="text-gray-400 text-lg">
            {activeFilterCount > 0 ? "No flashcards match your filters." : "No flashcards available."}
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-emerald-500 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="max-w-xl mx-auto w-full flex flex-col gap-6 pt-2">
          <FlashCard card={currentCard} isFlipped={isFlipped} onFlip={flip} reversed={startSide === "explanation"} />

          {/* Inline card actions */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Rating:</span>
              <RatingStars value={currentCard.rating} onChange={(v) => updateEntry(currentCard.id, { rating: v })} />
            </div>
            <button
              onClick={() => updateEntry(currentCard.id, { includeInPractice: false })}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 active:text-red-700 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-red-50 active:bg-red-100"
              title="Remove from practice">
              <span>✕</span>
              <span>Remove</span>
            </button>
          </div>

          <CardNavigation
            currentIndex={currentIndex}
            total={total}
            progress={progress}
            onPrev={goPrev}
            onNext={goNext}
            onReset={reset}
          />
          <p className="text-center text-xs text-gray-300">Tap the card to flip · use buttons to navigate</p>
        </div>
      )}
    </div>
  );
}
