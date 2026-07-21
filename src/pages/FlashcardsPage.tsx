import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";

const LS_START_SIDE = "flashcard_start_side";
const LS_SHOW_IMAGES = "flashcard_show_images";
import { FlashCard } from "@/features/flashcards/components/FlashCard";
import { CardNavigation } from "@/features/flashcards/components/CardNavigation";
import { useFlashcards } from "@/features/flashcards/hooks/useFlashcards";
import { RatingStars } from "@/shared/ui/RatingStars";
import { Button } from "@/shared/ui/Button";
import { SideDrawer } from "@/shared/ui/SideDrawer";
import { PracticeFilterPanel } from "@/features/practice/components/PracticeFilterPanel";
import { EntryCategory } from "@/features/entries/types";
import { useEntryCrud } from "@/hooks/useEntryCrud";
import type { SRGrade } from "@/features/entries/types";
import { FaShuffle } from "react-icons/fa6";

export function FlashcardsPage() {
  const { t } = useTranslation();
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [startSide, setStartSide] = useState<"word" | "explanation">(() =>
    localStorage.getItem(LS_START_SIDE) === "explanation" ? "explanation" : "word",
  );
  const [shuffleKey, setShuffleKey] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [showImages, setShowImages] = useState(() => localStorage.getItem(LS_SHOW_IMAGES) === "true");

  function toggleShowImages() {
    const next = !showImages;
    setShowImages(next);
    localStorage.setItem(LS_SHOW_IMAGES, String(next));
  }

  function toggleStartSide() {
    const next = startSide === "word" ? "explanation" : "word";
    setStartSide(next);
    localStorage.setItem(LS_START_SIDE, next);
    reset();
  }

  function handleShuffle() {
    setShuffleKey((k) => k + 1);
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
    reset();
  }

  const routerNavigate = useNavigate();
  const { updateEntry, reviewEntry } = useEntryCrud();

  function handleGrade(grade: SRGrade) {
    if (currentCard) reviewEntry(currentCard.id, grade, 'flashcard');
    navigate(goNext);
  }

  const { currentCard, currentIndex, total, progress, isFlipped, allTags, goNext, goPrev, flip, reset } = useFlashcards(
    { selectedRatings, selectedCategory, selectedTag, shuffleKey },
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

  const filterBtnInactive =
    "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";
  const filterBtnActive = "bg-emerald-600 text-white border-emerald-600";

  const filtersTitle = t("practice.filters") + (activeFilterCount > 0 ? ` (${activeFilterCount})` : "");

  return (
    <div className="flex flex-col gap-4">
      {/* ── Compact header block ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => routerNavigate("/practice")}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 shrink-0">
            {t("practice.flashcards.title")}
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:ml-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={toggleStartSide}
            title={startSide === "word" ? t("practice.flashcards.showingWordFirst") : t("practice.flashcards.showingExplanationFirst")}
            className={[
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors",
              filterBtnInactive,
            ].join(" ")}>
            <span>{startSide === "word" ? "🔤" : "💬"}</span>
            <span>{startSide === "word" ? t("practice.flashcards.wordFirst") : t("practice.flashcards.explanationFirst")}</span>
          </button>

          <button
            onClick={handleShuffle}
            title={t("practice.flashcards.shuffle")}
            className={[
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors",
              filterBtnInactive,
            ].join(" ")}>
            <span className={shaking ? "animate-shake inline-block" : "inline-block"}>
              <FaShuffle />
            </span>
            <span>{t("practice.flashcards.shuffle")}</span>
          </button>

          <button
            onClick={toggleShowImages}
            className={[
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors",
              showImages ? filterBtnActive : filterBtnInactive,
            ].join(" ")}>
            🖼 {t("practice.showImages")}
          </button>

          {/* Filters button + Clear — desktop only */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 shrink-0" />
            <Button variant={showFilters ? "primary" : "secondary"} size="sm" onClick={() => setShowFilters((v) => !v)}>
              {t("practice.filters")}
              {activeFilterCount > 0 && <span className="ml-1">({activeFilterCount})</span>}
              <span className="text-xs ml-1">{showFilters ? "▲" : "▼"}</span>
            </Button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0">
                {t("practice.clear")}
              </button>
            )}
          </div>
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Collapsible filters panel ────────────────────────────── */}
      {showFilters && (
        <div className="hidden sm:block">
          <PracticeFilterPanel
            allTags={allTags}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
            selectedRatings={selectedRatings}
            onRatingsChange={setSelectedRatings}
          />
        </div>
      )}

      {/* Mobile filter sidebar */}
      <SideDrawer
        open={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onOpen={() => setIsMobileDrawerOpen(true)}
        tabLabel={t("practice.filters").toUpperCase()}
        title={filtersTitle}
        topline
        hasActiveIndicator={activeFilterCount > 0}>
        <PracticeFilterPanel
          allTags={allTags}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          selectedRatings={selectedRatings}
          onRatingsChange={setSelectedRatings}
        />
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium text-left">
            {t("practice.clearFilters")}
          </button>
        )}
      </SideDrawer>

      {/* ── Card area or empty state ─────────────────────────────── */}
      {!currentCard ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-lg">
            {activeFilterCount > 0 ? t("practice.flashcards.noCardsFiltered") : t("practice.flashcards.noCards")}
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-emerald-500 hover:underline">
              {t("practice.clearFilters")}
            </button>
          )}
        </div>
      ) : (
        <div className="max-w-xl mx-auto w-full flex flex-col gap-6 pt-2">
          <div
            className="transition-all duration-200"
            style={{ opacity: cardVisible ? 1 : 0, transform: cardVisible ? "translateY(0)" : "translateY(10px)" }}>
            <FlashCard
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={flip}
              reversed={startSide === "explanation"}
              flipAnimated={flipAnimated}
              showImageOnFront={showImages}
            />
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                {t("practice.flashcards.rating")}
              </span>
              <RatingStars value={currentCard.rating} onChange={(v) => updateEntry(currentCard.id, { rating: v })} />
            </div>
            <button
              onClick={() => updateEntry(currentCard.id, { includeInPractice: false })}
              className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 active:text-red-700 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100"
              title={t("practice.flashcards.remove")}>
              <span>✕</span>
              <span>{t("practice.flashcards.remove")}</span>
            </button>
          </div>

          {isFlipped ? (
            <div className="flex flex-col gap-2">
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                {t("practice.sr.rateKnowledge")}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { grade: 0 as SRGrade, labelKey: "practice.sr.again", cls: "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" },
                    { grade: 3 as SRGrade, labelKey: "practice.sr.hard",  cls: "border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20" },
                    { grade: 4 as SRGrade, labelKey: "practice.sr.good",  cls: "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" },
                    { grade: 5 as SRGrade, labelKey: "practice.sr.easy",  cls: "border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" },
                  ] as const
                ).map(({ grade, labelKey, cls }) => (
                  <button
                    key={grade}
                    onClick={() => handleGrade(grade)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-colors bg-white dark:bg-gray-800 ${cls}`}>
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <CardNavigation
              currentIndex={currentIndex}
              total={total}
              progress={progress}
              onPrev={() => navigate(goPrev)}
              onNext={() => navigate(goNext)}
              onReset={reset}
            />
          )}
          {!isFlipped && (
            <p className="text-center text-xs text-gray-300 dark:text-gray-600">
              {t("practice.flashcards.tapHint")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
