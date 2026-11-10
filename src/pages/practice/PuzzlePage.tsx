import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EntriesCount } from "@/shared/ui/EntriesCount";
import { usePracticeEntries, shuffle } from "@/features/practice/hooks/usePracticeEntries";
import { usePracticeFilters } from "@/features/practice/hooks/usePracticeFilters";
import { PracticeFiltersArea } from "@/features/practice/components/PracticeFiltersArea";
import { PracticeIdleFilters } from "@/features/practice/components/PracticeIdleFilters";
import { PracticeHelpModal } from "@/features/practice/components/PracticeHelpModal";
import { PracticePageHeader } from "@/features/practice/components/PracticePageHeader";
import { PuzzleGame } from "@/features/practice/components/PuzzleGame";
import { Button } from "@/shared/ui/Button";
import type { Entry } from "@/features/entries/types";
import { useEntryCrud } from "@/hooks/useEntryCrud";

const LS_PUZZLE_SHOW_IMAGES = "puzzle_show_images";

type Phase = "idle" | "playing" | "done";

export function PuzzlePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const filterState = usePracticeFilters();
  const { filters } = filterState;
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

  const { reviewEntry, logGameComplete } = useEntryCrud();

  const filteredEntries = usePracticeEntries("puzzle", filters);

  useEffect(() => {
    if (phase === "done") logGameComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (canStart) startSession();
    else setPhase("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const currentEntry = questions[currentIdx] ?? null;

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

      <PracticePageHeader
        title={t("practice.puzzle.title")}
        onBack={phase === "idle" ? () => navigate("/practice") : () => setPhase("idle")}
        backLabel={t("practice.match.backToPractice")}
        onHelp={() => setShowHelp(true)}
        showHelpBtn={phase !== "idle"}
        filterState={filterState}
      >
        <button
          onClick={toggleShowImages}
          className={[
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors",
            showImages ? "bg-emerald-600 text-white border-emerald-600" : btnInactive,
          ].join(" ")}>
          🖼 {t("practice.showImages")}
        </button>
      </PracticePageHeader>

      <PracticeFiltersArea
        filterState={filterState}
        avaliableEntriesCount={filteredEntries.length}
        inlineOnMobile={phase === "idle"}
      />

      {/* ── Idle: start prompt ──────────────────────────────────── */}
      {phase === "idle" && (
        <div className="flex flex-col items-center gap-4 py-8 pb-28 sm:pb-8 max-w-xl mx-auto w-full">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed max-w-sm">
            {t("practice.puzzle.helpDesc")}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            <EntriesCount count={filteredEntries.length} label={t("practice.entriesAvailable", { count: filteredEntries.length })} />
          </p>
          <PracticeIdleFilters filterState={filterState} />
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
