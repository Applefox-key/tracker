import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { usePracticeEntries, usePracticeTags, shuffle, type MasteryFilter } from "@/features/practice/hooks/usePracticeEntries";
import { PracticeFilterPanel } from "@/features/practice/components/PracticeFilterPanel";
import { PracticeHelpModal } from "@/features/practice/components/PracticeHelpModal";
import { PuzzleGame } from "@/features/practice/components/PuzzleGame";
import { Button } from "@/shared/ui/Button";
import { SideDrawer } from "@/shared/ui/SideDrawer";
import type { Entry, EntryCategory } from "@/features/entries/types";
import { useEntryCrud } from "@/hooks/useEntryCrud";
import { TfiPanel } from "react-icons/tfi";

const LS_PUZZLE_SHOW_IMAGES = "puzzle_show_images";

type Phase = "idle" | "playing" | "done";

export function PuzzlePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const allTags = usePracticeTags();

  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showImages, setShowImages] = useState(() => localStorage.getItem(LS_PUZZLE_SHOW_IMAGES) === "true");
  const [showHelp, setShowHelp] = useState(false);

  function toggleShowImages() {
    const next = !showImages;
    setShowImages(next);
    localStorage.setItem(LS_PUZZLE_SHOW_IMAGES, String(next));
  }

  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<Entry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongEntries, setWrongEntries] = useState<Entry[]>([]);

  const { reviewEntry } = useEntryCrud();

  const filteredEntries = usePracticeEntries("puzzle", { selectedRatings, selectedCategory, selectedTag, masteryFilter });

  useEffect(() => {
    if (phase !== "playing") return;
    if (canStart) startSession();
    else setPhase("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRatings, selectedCategory, selectedTag, masteryFilter]);

  const activeFilterCount = [selectedRatings.length > 0, selectedCategory !== null, selectedTag !== null, masteryFilter !== null].filter(
    Boolean,
  ).length;

  const currentEntry = questions[currentIdx] ?? null;

  function clearFilters() {
    setSelectedRatings([]);
    setSelectedCategory(null);
    setSelectedTag(null);
    setMasteryFilter(null);
  }

  function startSession() {
    setQuestions(shuffle(filteredEntries));
    setCurrentIdx(0);
    setScore(0);
    setWrongEntries([]);
    setPhase("playing");
  }

  function retryMistakes() {
    setQuestions(shuffle(wrongEntries));
    setCurrentIdx(0);
    setScore(0);
    setWrongEntries([]);
    setPhase("playing");
  }

  function advanceOrFinish() {
    if (currentIdx + 1 >= questions.length) setPhase("done");
    else setCurrentIdx((i) => i + 1);
  }

  const filtersTitle = t("practice.filters") + (activeFilterCount > 0 ? ` (${activeFilterCount})` : "");
  const canStart = filteredEntries.length > 0;
  const progress = questions.length > 0 ? Math.round((currentIdx / questions.length) * 100) : 0;
  const resultPct = phase === "done" && questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const btnInactive =
    "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";

  return (
    <div className="flex flex-col gap-4">
      <PracticeHelpModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title={t("practice.puzzle.title")}
        howToPlayLabel={t("practice.helpModal.howToPlay")}
        description={t("practice.puzzle.helpDesc")}
        settingsLabel={t("practice.helpModal.settings")}
        closeLabel={t("practice.helpModal.close")}
        settings={[{ icon: "🖼", label: t("practice.showImages"), desc: t("practice.puzzle.helpShowImages") }]}
      />

      {/* ── Header (always visible) ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
        <div className="flex items-start  gap-3 min-w-0 pt-[1rem]">
          <Button onClick={() => navigate("/practice")}>
            <FaArrowLeft />
            {t("practice.match.backToPractice")}
          </Button>
          <div className="min-w-0 pb-2">
            <div className="flex items-center  gap-1.5">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("practice.puzzle.title")}</h1>
              {phase !== "idle" && (
                <button
                  onClick={() => setShowHelp(true)}
                  className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-full text-sm sm:text-xs font-bold w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 transition-colors mt-0.5">
                  ?
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={toggleShowImages}
            className={[
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors",
              showImages ? "bg-emerald-600 text-white border-emerald-600" : btnInactive,
            ].join(" ")}>
            🖼 {t("practice.showImages")}
          </button>
          <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-gray-600 shrink-0" />
          <Button
            variant={showFilters ? "primary" : "secondary"}
            size="sm"
            className="hidden sm:block"
            onClick={() => setShowFilters((v) => !v)}>
            {t("practice.filters")}
            {activeFilterCount > 0 && <span className="ml-1">({activeFilterCount})</span>}
            <span className="text-xs ml-1">{showFilters ? "▲" : "▼"}</span>
          </Button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">
              {t("practice.clear")}
            </button>
          )}
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Collapsible filters panel ───────────────────────────── */}
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
            masteryFilter={masteryFilter}
            onMasteryFilterChange={setMasteryFilter}
          />
        </div>
      )}

      {/* Mobile filter sidebar */}
      <SideDrawer
        open={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onOpen={() => setIsMobileDrawerOpen(true)}
        tabLabel={t("practice.filters")}
        title={filtersTitle}
        tabIcon={<TfiPanel className="text-xl" />}
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
          masteryFilter={masteryFilter}
          onMasteryFilterChange={setMasteryFilter}
          inDrawer
        />
      </SideDrawer>

      {/* ── Idle: start prompt ──────────────────────────────────── */}
      {phase === "idle" && (
        <div className="flex flex-col items-center gap-4 py-8 pb-28 sm:pb-8 max-w-xl mx-auto w-full">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed max-w-sm">
            {t("practice.puzzle.helpDesc")}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t("practice.entriesAvailable", { count: filteredEntries.length })}
          </p>
          {!canStart && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
              {t("practice.puzzle.noMatchingEntries")}
            </p>
          )}
          {canStart && (
            <Button onClick={startSession} size="lg" className="hidden sm:flex">
              {t("practice.puzzle.startPuzzle")}
            </Button>
          )}

          {canStart && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 sm:hidden z-10">
              <Button onClick={startSession} size="lg" className="w-full h-14 text-base">
                {t("practice.puzzle.startPuzzle")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Playing ─────────────────────────────────────────────── */}
      {phase === "playing" && currentEntry && (
        <div className="flex flex-col gap-6 max-w-xl mx-auto  w-full">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t("practice.puzzle.progressLabel", { current: currentIdx + 1, total: questions.length })}
            </span>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <PuzzleGame
            key={`${currentEntry.id}-${currentIdx}`}
            entry={currentEntry}
            allEntries={filteredEntries}
            showImages={showImages}
            nextLabel={currentIdx + 1 < questions.length ? t("practice.puzzle.next") : t("practice.puzzle.seeResults")}
            skipLabel={currentIdx + 1 < questions.length ? t("practice.puzzle.skip") : t("practice.puzzle.finish")}
            onCorrect={(_hintUsed, retried) => {
              setScore((n) => n + 1);
              reviewEntry(currentEntry.id, retried ? 4 : 5, "puzzle");
              advanceOrFinish();
            }}
            onSkip={(_hintUsed) => {
              reviewEntry(currentEntry.id, 0, "puzzle");
              setWrongEntries((prev) => [...prev, currentEntry]);
              advanceOrFinish();
            }}
          />
        </div>
      )}

      {/* ── Done: results ───────────────────────────────────────── */}
      {phase === "done" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
          <span className="text-5xl">{resultPct >= 80 ? "🏆" : resultPct >= 50 ? "👍" : "💪"}</span>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {score} / {questions.length}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t("practice.puzzle.pctSolved", { pct: resultPct })}
            </p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${resultPct}%` }}
            />
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button variant="secondary" onClick={startSession}>
              {t("practice.puzzle.tryAgain")}
            </Button>
            {wrongEntries.length > 0 && (
              <Button variant="secondary" onClick={retryMistakes}>
                {t("practice.retryMistakes", { count: wrongEntries.length })}
              </Button>
            )}
            <Button onClick={() => navigate("/practice")}>{t("practice.puzzle.backToPractice")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
