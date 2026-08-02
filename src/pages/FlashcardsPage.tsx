import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";

const LS_START_SIDE = "flashcard_start_side";
const LS_SHOW_IMAGES = "flashcard_show_images";
import { FlashCard } from "@/features/flashcards/components/FlashCard";
import { CardNavigation } from "@/features/flashcards/components/CardNavigation";
import { useFlashcards } from "@/features/flashcards/hooks/useFlashcards";
import { Button } from "@/shared/ui/Button";
import { SideDrawer } from "@/shared/ui/SideDrawer";
import { PracticeFilterPanel } from "@/features/practice/components/PracticeFilterPanel";
import { PracticeHelpModal } from "@/features/practice/components/PracticeHelpModal";
import { EntryCategory } from "@/features/entries/types";
import { useEntryCrud } from "@/hooks/useEntryCrud";
import type { SRGrade } from "@/features/entries/types";
import { FaShuffle } from "react-icons/fa6";
import { TfiPanel } from "react-icons/tfi";

const SR_GRADES = [
  {
    grade: 0 as SRGrade,
    labelKey: "practice.sr.again",
    cls: "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
  },
  {
    grade: 3 as SRGrade,
    labelKey: "practice.sr.hard",
    cls: "border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20",
  },
  {
    grade: 4 as SRGrade,
    labelKey: "practice.sr.good",
    cls: "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
  },
  {
    grade: 5 as SRGrade,
    labelKey: "practice.sr.easy",
    cls: "border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
  },
] as const;

const removeBtn =
  "flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 active:text-red-700 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20";

export function FlashcardsPage() {
  const { t } = useTranslation();
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [unmasteredOnly, setUnmasteredOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [startSide, setStartSide] = useState<"word" | "explanation">(() =>
    localStorage.getItem(LS_START_SIDE) === "explanation" ? "explanation" : "word",
  );
  const [shaking, setShaking] = useState(false);
  const [showImages, setShowImages] = useState(() => localStorage.getItem(LS_SHOW_IMAGES) === "true");
  const [showHelp, setShowHelp] = useState(false);

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
    shuffleOnce();
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  }

  const routerNavigate = useNavigate();
  const { updateEntry, reviewEntry } = useEntryCrud();

  function handleGrade(grade: SRGrade) {
    if (currentCard) reviewEntry(currentCard.id, grade, "flashcard");
    navigate(goNext);
  }

  const { currentCard, currentIndex, total, progress, isFlipped, allTags, goNext, goPrev, flip, reset, shuffleOnce } =
    useFlashcards({ selectedRatings, selectedCategory, selectedTag, unmasteredOnly });

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

  const activeFilterCount = [
    selectedRatings.length > 0,
    selectedCategory !== null,
    selectedTag !== null,
    unmasteredOnly,
  ].filter(Boolean).length;

  function clearFilters() {
    setSelectedRatings([]);
    setSelectedCategory(null);
    setSelectedTag(null);
    setUnmasteredOnly(false);
  }

  const filterBtnInactive =
    "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";
  const filterBtnActive = "bg-emerald-600 text-white border-emerald-600";

  const filtersTitle = t("practice.filters") + (activeFilterCount > 0 ? ` (${activeFilterCount})` : "");

  return (
    <div className="flex flex-col gap-4">
      <PracticeHelpModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title={t("practice.flashcards.title")}
        howToPlayLabel={t("practice.helpModal.howToPlay")}
        description={t("practice.flashcards.helpDesc")}
        settingsLabel={t("practice.helpModal.settings")}
        closeLabel={t("practice.helpModal.close")}
        settings={[
          {
            icon: startSide === "word" ? "🔤" : "💬",
            label:
              startSide === "word" ? t("practice.flashcards.wordFirst") : t("practice.flashcards.explanationFirst"),
            desc: t("practice.flashcards.helpStartSide"),
          },
          { icon: "🔀", label: t("practice.flashcards.shuffle"), desc: t("practice.flashcards.helpShuffle") },
          { icon: "🖼", label: t("practice.showImages"), desc: t("practice.flashcards.helpShowImages") },
        ]}
      />

      {/* ── Header with white bg on mobile ─────────────────────────── */}
      <div className="-mx-4 px-4 pb-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sm:mx-0 sm:px-0 sm:pb-0 sm:bg-transparent sm:border-0 sm:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-3 pb-2 pt-[1rem]">
            <Button onClick={() => routerNavigate("/practice")}>
              <FaArrowLeft />
              {t("practice.match.backToPractice")}
            </Button>
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 shrink-0">
                {t("practice.flashcards.title")}
              </h1>
              <button
                onClick={() => setShowHelp(true)}
                className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-full text-sm sm:text-xs font-bold w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 transition-colors">
                ?
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:ml-auto flex-wrap sm:flex-nowrap">
            <button
              onClick={toggleStartSide}
              title={
                startSide === "word"
                  ? t("practice.flashcards.showingWordFirst")
                  : t("practice.flashcards.showingExplanationFirst")
              }
              className={[
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                filterBtnInactive,
              ].join(" ")}>
              <span>{startSide === "word" ? "🔤" : "💬"}</span>
              <span>
                {startSide === "word" ? t("practice.flashcards.wordFirst") : t("practice.flashcards.explanationFirst")}
              </span>
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

            <div className="hidden sm:flex items-center gap-3">
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 shrink-0" />
              <Button
                variant={showFilters ? "primary" : "secondary"}
                size="sm"
                onClick={() => setShowFilters((v) => !v)}>
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
      </div>

      <hr className="hidden sm:block border-gray-200 dark:border-gray-700" />

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
            unmasteredOnly={unmasteredOnly}
            onUnmasteredOnlyChange={setUnmasteredOnly}
          />
        </div>
      )}

      <SideDrawer
        open={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onOpen={() => setIsMobileDrawerOpen(true)}
        tabLabel={t("practice.filters")}
        tabIcon={<TfiPanel className="text-xl" />}
        title={filtersTitle}
        topline
        hasActiveIndicator={activeFilterCount > 0}
        headerAction={
          activeFilterCount > 0 ? (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 font-medium">
              {t("practice.clearFilters")}
            </button>
          ) : undefined
        }>
        <PracticeFilterPanel
          allTags={allTags}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          selectedRatings={selectedRatings}
          onRatingsChange={setSelectedRatings}
          unmasteredOnly={unmasteredOnly}
          onUnmasteredOnlyChange={setUnmasteredOnly}
          inDrawer
        />
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
        <>
          <div className="max-w-xl mx-auto w-full flex flex-col gap-4 pt-2 pb-56 sm:pb-0">
            {/* Card */}
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

            {/* ── Desktop: SR + nav — always visible ─────────────── */}
            <div className="hidden sm:flex flex-col gap-3">
              {/* SR header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {t("practice.sr.rateKnowledge")}
                </span>
                <button
                  onClick={() => updateEntry(currentCard.id, { includeInPractice: false })}
                  className={removeBtn}
                  title={t("practice.flashcards.remove")}>
                  <span>✕</span>
                  <span>{t("practice.flashcards.remove")}</span>
                </button>
              </div>

              {/* SR buttons */}
              <div className="grid grid-cols-4 gap-2">
                {SR_GRADES.map(({ grade, labelKey, cls }) => (
                  <button
                    key={grade}
                    onClick={() => handleGrade(grade)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-colors bg-white dark:bg-gray-800 ${cls}`}>
                    {t(labelKey)}
                  </button>
                ))}
              </div>

              {/* Progress + nav */}
              <CardNavigation
                currentIndex={currentIndex}
                total={total}
                progress={progress}
                onPrev={() => navigate(goPrev)}
                onNext={() => navigate(goNext)}
                onReset={reset}
              />
            </div>
          </div>

          {/* ── Mobile fixed bottom panel ─────────────────────────── */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)]">
            <div className="px-4 pt-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
              {/* SR header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("practice.sr.rateKnowledge")}
                </span>
                <button
                  onClick={() => updateEntry(currentCard.id, { includeInPractice: false })}
                  className={removeBtn}
                  title={t("practice.flashcards.remove")}>
                  <span>✕</span>
                  <span>{t("practice.flashcards.remove")}</span>
                </button>
              </div>

              {/* SR buttons */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {SR_GRADES.map(({ grade, labelKey, cls }) => (
                  <button
                    key={grade}
                    onClick={() => handleGrade(grade)}
                    className={`py-2.5 rounded-xl border text-sm font-semibold transition-colors bg-white dark:bg-gray-800 ${cls}`}>
                    {t(labelKey)}
                  </button>
                ))}
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">
                  {currentIndex + 1} / {total}
                </span>
              </div>

              {/* Nav buttons */}
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => navigate(goPrev)} className="flex-1 py-2.5">
                  {t("practice.flashcards.prev")}
                </Button>
                <Button variant="secondary" onClick={reset} className="py-2.5">
                  {t("practice.flashcards.reset")}
                </Button>
                <Button onClick={() => navigate(goNext)} className="flex-1 py-2.5">
                  {t("practice.flashcards.next")}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
