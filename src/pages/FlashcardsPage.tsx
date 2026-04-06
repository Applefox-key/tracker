import { useState, useRef, useCallback } from "react";

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

  const [cardVisible, setCardVisible] = useState(true);
  const [flipAnimated, setFlipAnimated] = useState(true);
  const navLock = useRef(false);

  const navigate = useCallback((action: () => void) => {
    if (navLock.current) return;
    navLock.current = true;
    setFlipAnimated(false);
    setCardVisible(false);
    setTimeout(() => {
      action();
      setTimeout(() => {
        setCardVisible(true);
        setFlipAnimated(true);
        navLock.current = false;
      }, 50);
    }, 200);
  }, []);

  const activeFilterCount = [selectedRatings.length > 0, selectedCategory !== null, selectedTag !== null].filter(
    Boolean,
  ).length;

  function clearFilters() {
    setSelectedRatings([]);
    setSelectedCategory(null);
    setSelectedTag(null);
  }

  const filterBtnInactive = "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";
  const filterBtnActive = "bg-emerald-600 text-white border-emerald-600";

  return (
    <div className="flex flex-col gap-4">
      {/* ── Compact header block ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 shrink-0">Flashcards</h1>

        <div className="flex items-center gap-3 sm:ml-auto">
          <RatingMultiSelect selected={selectedRatings} onChange={setSelectedRatings} />

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 shrink-0" />

          <button
            onClick={toggleStartSide}
            title={
              startSide === "word"
                ? "Showing word first — click to show explanation first"
                : "Showing explanation first — click to show word first"
            }
            className={["flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors", filterBtnInactive].join(" ")}>
            <span>{startSide === "word" ? "🔤" : "💬"}</span>
            <span className="hidden sm:inline">{startSide === "word" ? "Word first" : "Explanation first"}</span>
          </button>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 shrink-0" />

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

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Collapsible filters panel ────────────────────────────── */}
      {showFilters && (
        <div className="flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 pt-1.5 shrink-0 w-16">Category:</span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={["px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors", selectedCategory === null ? filterBtnActive : filterBtnInactive].join(" ")}>
                All
              </button>
              {CATEGORIES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                  className={["px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors", selectedCategory === key ? filterBtnActive : filterBtnInactive].join(" ")}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 pt-1 shrink-0 w-16">Tag:</span>
              <div className="flex gap-1.5 flex-wrap">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                    className={[
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                      selectedTag === tag.id
                        ? filterBtnActive
                        : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:text-emerald-600",
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
          <p className="text-gray-400 dark:text-gray-500 text-lg">
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
          <div
            className="transition-all duration-200"
            style={{ opacity: cardVisible ? 1 : 0, transform: cardVisible ? "translateY(0)" : "translateY(10px)" }}>
            <FlashCard card={currentCard} isFlipped={isFlipped} onFlip={flip} reversed={startSide === "explanation"} flipAnimated={flipAnimated} />
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Rating:</span>
              <RatingStars value={currentCard.rating} onChange={(v) => updateEntry(currentCard.id, { rating: v })} />
            </div>
            <button
              onClick={() => updateEntry(currentCard.id, { includeInPractice: false })}
              className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 active:text-red-700 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100"
              title="Remove from practice">
              <span>✕</span>
              <span>Remove</span>
            </button>
          </div>

          <CardNavigation
            currentIndex={currentIndex}
            total={total}
            progress={progress}
            onPrev={() => navigate(goPrev)}
            onNext={() => navigate(goNext)}
            onReset={reset}
          />
          <p className="text-center text-xs text-gray-300 dark:text-gray-600">Tap the card to flip · use buttons to navigate</p>
        </div>
      )}
    </div>
  );
}
