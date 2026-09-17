import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { usePracticeEntries, shuffle } from "@/features/practice/hooks/usePracticeEntries";
import { usePracticeFilters } from "@/features/practice/hooks/usePracticeFilters";
import { PracticeFiltersArea } from "@/features/practice/components/PracticeFiltersArea";
import { FlashCard } from "@/features/flashcards/components/FlashCard";
import { getEntryImageUrl } from "@/api/api";
import { useEntryCrud } from "@/hooks/useEntryCrud";
import { Button } from "@/shared/ui/Button";
import type { Entry } from "@/features/entries/types";
import type { Flashcard } from "@/features/flashcards/types";

const LS_DELAY = "auto_flashcards_delay";
const FADE_MS = 280;

function entryToCard(entry: Entry): Flashcard {
  return {
    id: entry.id,
    front: entry.word,
    back: entry.explanation,
    hint: entry.example || undefined,
    rating: entry.rating,
    img: entry.img ? getEntryImageUrl(entry.img) : null,
    category: entry.category,
  };
}

type Phase = "idle" | "playing" | "done";

export function AutoFlashcardsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const filterState = usePracticeFilters();
  const { filters, activeFilterCount, clearFilters } = filterState;
  const { logGameComplete } = useEntryCrud();

  const [delay, setDelay] = useState<number>(() => {
    const saved = parseFloat(localStorage.getItem(LS_DELAY) ?? "");
    return isNaN(saved) ? 2 : Math.min(10, Math.max(0.5, saved));
  });

  const [phase, setPhase] = useState<Phase>("idle");
  const [cards, setCards] = useState<Entry[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [running, setRunning] = useState(false);
  const [visible, setVisible] = useState(true);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredEntries = usePracticeEntries("flashcards", filters);

  useEffect(() => {
    if (phase === "done") logGameComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  useEffect(() => () => { if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current); }, []);

  const goToCard = useCallback((nextIndex: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => {
      setIndex(nextIndex);
      setFlipped(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    }, FADE_MS);
  }, []);

  useEffect(() => {
    if (!running) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!flipped) {
        setFlipped(true);
      } else {
        const next = index + 1;
        if (next >= cards.length) {
          setRunning(false);
          setPhase("done");
        } else {
          goToCard(next);
        }
      }
    }, delay * 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [running, flipped, index, delay, cards.length, goToCard]);

  function handleDelayChange(val: number) {
    setDelay(val);
    localStorage.setItem(LS_DELAY, String(val));
  }

  function startSession() {
    setCards(shuffle(filteredEntries));
    setIndex(0);
    setFlipped(false);
    setRunning(false);
    setVisible(true);
    setPhase("playing");
  }

  const card = cards[index] ?? null;
  const flashCard: Flashcard | null = card ? entryToCard(card) : null;

  const btnInactive =
    "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0 pb-2 pt-[1rem]">
          <Button onClick={() => { setRunning(false); navigate("/practice"); }}>
            <FaArrowLeft />
            {t("practice.autoFlashcards.backToPractice")}
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("practice.autoFlashcards.title")}
          </h1>
        </div>

        {phase === "idle" && (
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap sm:flex-nowrap">
            <Button
              variant={filterState.showFilters ? "primary" : "secondary"}
              size="sm"
              className="hidden sm:block"
              onClick={() => filterState.setShowFilters((v) => !v)}>
              {t("practice.filters")}
              {activeFilterCount > 0 && <span className="ml-1">({activeFilterCount})</span>}
              <span className="text-xs ml-1">{filterState.showFilters ? "▲" : "▼"}</span>
            </Button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">
                {t("practice.clear")}
              </button>
            )}
          </div>
        )}
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {phase === "idle" && (
        <PracticeFiltersArea filterState={filterState} avaliableEntriesCount={filteredEntries.length} />
      )}

      {/* ── Idle ────────────────────────────────────────────────── */}
      {phase === "idle" && (
        <div className="flex flex-col items-center gap-6 py-6 pb-28 sm:pb-8 max-w-xl mx-auto w-full">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed max-w-sm">
            {t("practice.autoFlashcards.helpDesc")}
          </p>

          {/* Delay slider */}
          <div className="flex flex-col items-center gap-2 w-full max-w-xs">
            <label className="text-sm text-gray-500 dark:text-gray-400">
              {t("practice.autoFlashcards.delayLabel")}:{" "}
              <strong className="text-gray-700 dark:text-gray-200">{delay}s</strong>
            </label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={delay}
              onChange={(e) => handleDelayChange(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between w-full text-xs text-gray-400 dark:text-gray-500">
              <span>0.5s</span>
              <span>10s</span>
            </div>
          </div>

          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t("practice.entriesAvailable", { count: filteredEntries.length })}
          </p>

          {filteredEntries.length === 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
              {t("practice.puzzle.noMatchingEntries")}
            </p>
          )}

          {filteredEntries.length > 0 && (
            <>
              <Button onClick={startSession} size="lg" className="hidden sm:flex">
                {t("practice.autoFlashcards.startBtn")}
              </Button>
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 sm:hidden z-10">
                <Button onClick={startSession} size="lg" className="w-full h-14 text-base">
                  {t("practice.autoFlashcards.startBtn")}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Playing ─────────────────────────────────────────────── */}
      {phase === "playing" && flashCard && (
        <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
          {/* Progress */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setRunning(false); setPhase("idle"); }}
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0">
              {t("practice.quit")}
            </button>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((index + 1) / cards.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">
              {index + 1} / {cards.length}
            </span>
          </div>

          {/* Card with fade transition */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "scale(1)" : "scale(0.97)",
              transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
            }}>
            <FlashCard
              card={flashCard}
              isFlipped={flipped}
              onFlip={() => { if (!running) setFlipped((f) => !f); }}
              reversed={true}
              flipAnimated={visible}
            />
          </div>

          {/* Controls */}
          <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sm:border-t-0 sm:bg-transparent sm:dark:bg-transparent flex items-center justify-between gap-2 py-3 sm:px-0 sm:py-0">
            {!running ? (
              <div className="shrink-0 flex gap-2">
                <button
                  onClick={() => index > 0 && goToCard(index - 1)}
                  disabled={index === 0}
                  className={`text-sm px-3 py-1.5 border rounded transition-colors disabled:opacity-30 ${btnInactive}`}>
                  {t("practice.autoFlashcards.prevBtn")}
                </button>
                <button
                  onClick={() => {
                    if (index + 1 >= cards.length) setPhase("done");
                    else goToCard(index + 1);
                  }}
                  className={`text-sm px-3 py-1.5 border rounded transition-colors ${btnInactive}`}>
                  {t("practice.autoFlashcards.nextBtn")}
                </button>
              </div>
            ) : (
              <div />
            )}

            <div className="shrink-0 flex items-center gap-4">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {t("practice.autoFlashcards.perSide", { value: delay })}
              </span>
              <button
                onClick={() => setRunning((r) => !r)}
                className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
                  running
                    ? "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-200"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}>
                {running ? t("practice.autoFlashcards.pauseBtn") : t("practice.autoFlashcards.playBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Done ────────────────────────────────────────────────── */}
      {phase === "done" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
          <span className="text-5xl">🎉</span>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t("practice.autoFlashcards.done")}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {t("practice.autoFlashcards.doneDesc", { count: cards.length })}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button variant="secondary" onClick={startSession}>
              {t("practice.autoFlashcards.tryAgain")}
            </Button>
            <Button onClick={() => navigate("/practice")}>
              {t("practice.autoFlashcards.backToPractice")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
