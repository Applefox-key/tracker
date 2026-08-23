import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { entriesApi } from "@/api/api";
import { useEntryCrud } from "@/hooks/useEntryCrud";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Button } from "@/shared/ui/Button";
import { PracticeHelpModal } from "@/features/practice/components/PracticeHelpModal";
import { FlashcardGame } from "@/features/practice/components/FlashcardGame";
import { QuizGame } from "@/features/practice/components/QuizGame";
import { PuzzleGame } from "@/features/practice/components/PuzzleGame";
import { shuffle, wordCount } from "@/features/practice/hooks/usePracticeEntries";
import type { Entry } from "@/features/entries/types";

type DueMode = "flashcard" | "quiz" | "puzzle";
type Phase = "loading" | "idle" | "playing" | "done";

interface QueueItem {
  entry: Entry;
  mode: DueMode;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function isPuzzleable(entry: Entry): boolean {
  if (["note", "grammar"].includes(entry.category)) return false;
  return wordCount(entry.word) <= 10;
}

function buildQueue(entries: Entry[], modes: DueMode[]): QueueItem[] {
  return entries.map((entry) => {
    if (!entry.last_reviewed_at) return { entry, mode: "flashcard" };
    const valid = modes.filter((m) => {
      if (m === "quiz") return entries.length >= 4;
      if (m === "puzzle") return isPuzzleable(entry);
      return true;
    });
    const pool = valid.length > 0 ? valid : ["flashcard" as DueMode];
    const mode = pool[Math.floor(Math.random() * pool.length)];
    return { entry, mode };
  });
}

// ── DuePage ───────────────────────────────────────────────────────────────────

const MODE_OPTIONS: DueMode[] = ["flashcard", "quiz", "puzzle"];

export function DuePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authMode = useAuthStore((s) => s.mode);
  const { reviewEntry } = useEntryCrud();

  const [showHelp, setShowHelp] = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [dueEntries, setDueEntries] = useState<Entry[]>([]);
  const [selectedModes, setSelectedModes] = useState<DueMode[]>(["flashcard", "quiz", "puzzle"]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [remainingDue, setRemainingDue] = useState<number | null>(null);
  const [reviewResults, setReviewResults] = useState<{ before: Entry; after: Entry }[]>([]);

  useEffect(() => {
    if (authMode !== "authenticated") {
      setPhase("idle");
      return;
    }
    entriesApi
      .getDueEntries()
      .then((entries) => {
        setDueEntries(entries);
        setPhase("idle");
      })
      .catch(() => setPhase("idle"));
  }, [authMode]);

  useEffect(() => {
    if (phase !== "done") return;
    entriesApi
      .getDueEntries()
      .then((fresh) => {
        setDueEntries(fresh);
        setRemainingDue(fresh.length);
      })
      .catch(() => setRemainingDue(0));
  }, [phase]);

  function toggleMode(m: DueMode) {
    setSelectedModes((prev) =>
      prev.includes(m) ? (prev.length > 1 ? prev.filter((x) => x !== m) : prev) : [...prev, m],
    );
  }

  function handleReviewed(before: Entry, after: Entry) {
    setReviewResults(prev => [...prev, { before, after }]);
  }

  async function startSession() {
    setRemainingDue(null);
    setReviewResults([]);
    let entries = dueEntries;
    try {
      const fresh = await entriesApi.getDueEntries();
      setDueEntries(fresh);
      entries = fresh;
    } catch {
      // fall back to cached list
    }
    const q = buildQueue(shuffle(entries), selectedModes);
    setQueue(q);
    setCurrentIdx(0);
    setPhase("playing");
  }

  function handleNext() {
    if (currentIdx + 1 >= queue.length) setPhase("done");
    else setCurrentIdx((i) => i + 1);
  }

  const current = queue[currentIdx];
  const progress = queue.length > 0 ? Math.round((currentIdx / queue.length) * 100) : 0;
  const hasDue = dueEntries.length > 0;

  const btnInactive =
    "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";

  const MODE_ICONS: Record<string, string> = { flashcard: "🃏", quiz: "🧠", puzzle: "🧩" };

  return (
    <div className="flex flex-col gap-4">
      <PracticeHelpModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title={t("practice.due.title")}
        howToPlayLabel={t("practice.helpModal.howToPlay")}
        description={t("practice.due.description")}
        settingsLabel={t("practice.helpModal.settings")}
        closeLabel={t("practice.helpModal.close")}
        settings={MODE_OPTIONS.map((m) => ({
          icon: MODE_ICONS[m],
          label: t(`practice.due.modes.${m}`),
          desc: t(`practice.due.help${m.charAt(0).toUpperCase() + m.slice(1)}`),
        }))}
      />

      {/* ── Header (always visible) ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0 pb-2 pt-[1rem]">
          <Button onClick={() => navigate("/practice")}>
            <FaArrowLeft />
            {t("practice.match.backToPractice")}
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("practice.due.title")}</h1>
              {phase !== "idle" && phase !== "loading" && (
                <button
                  onClick={() => setShowHelp(true)}
                  className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-full text-sm sm:text-xs font-bold w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 transition-colors mt-0.5">
                  ?
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mode toggles — always visible once loaded */}
        {phase !== "loading" && hasDue && (
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            {MODE_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => toggleMode(m)}
                className={[
                  "px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                  selectedModes.includes(m) ? "bg-emerald-600 text-white border-emerald-600" : btnInactive,
                ].join(" ")}>
                {t(`practice.due.modes.${m}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Loading ──────────────────────────────────────────────── */}
      {phase === "loading" && (
        <div className="flex items-center justify-center min-h-[30vh]">
          <p className="text-gray-400 dark:text-gray-500">{t("common.loading", "Loading…")}</p>
        </div>
      )}

      {/* ── Idle: start prompt ──────────────────────────────────── */}
      {phase === "idle" && (
        <div className="flex flex-col items-center gap-4 py-8 pb-28 sm:pb-8 max-w-xl mx-auto w-full text-center">
          {hasDue ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm">
                {t("practice.due.description")}
              </p>

              <ul className="text-left flex flex-col gap-2 w-full max-w-xs">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest self-start">
                  {t("practice.due.selectModes")}
                </p>
                {MODE_OPTIONS.map((m) => (
                  <li key={m} className="flex items-start gap-2">
                    <span className="text-base shrink-0 leading-none mt-0.5">{MODE_ICONS[m]}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {t(`practice.due.modes.${m}`)}
                      </span>
                      {" — "}
                      {t(`practice.due.help${m.charAt(0).toUpperCase() + m.slice(1)}`)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="w-full max-w-xs border-t border-gray-100 dark:border-gray-800 pt-2 flex flex-col items-center gap-3">
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {t("practice.due.cardsToReview", { count: dueEntries.length })}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t("practice.due.newCardsNote")}</p>
                <Button onClick={startSession} size="lg" className="hidden sm:flex">
                  {t("practice.due.start")}
                </Button>
              </div>

              {/* Mobile: full-width sticky bottom button */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 sm:hidden z-10">
                <Button onClick={startSession} size="lg" className="w-full h-14 text-base">
                  {t("practice.due.start")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("practice.due.noDue")}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("practice.due.noDueHint")}</p>
              <Button variant="secondary" onClick={() => navigate("/practice")}>
                {t("practice.backToPractice")}
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── Playing ─────────────────────────────────────────────── */}
      {phase === "playing" && (
        <div className="flex flex-col gap-5 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPhase("idle")}
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0">
              {t("practice.quit")}
            </button>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">
              {currentIdx + 1} / {queue.length}
            </span>
          </div>

          {current && (
            <div key={`${current.entry.id}-${currentIdx}`}>
              {current.mode === "flashcard" && (
                <FlashcardGame
                  entry={current.entry}
                  onGrade={(grade) => {
                    reviewEntry(current.entry.id, grade, "flashcard", true)
                      .then(updated => { if (updated) handleReviewed(current.entry, updated); });
                    handleNext();
                  }}
                />
              )}
              {current.mode === "quiz" && (
                <QuizGame
                  entry={current.entry}
                  pool={dueEntries}
                  nextLabel={t("practice.quiz.next")}
                  onSelect={(isCorrect, hintUsed) => {
                    if (!hintUsed) {
                      reviewEntry(current.entry.id, isCorrect ? 5 : 0, "quiz")
                        .then(updated => { if (updated) handleReviewed(current.entry, updated); });
                    }
                  }}
                  onNext={handleNext}
                />
              )}
              {current.mode === "puzzle" && (
                <PuzzleGame
                  entry={current.entry}
                  allEntries={dueEntries}
                  nextLabel={t("practice.puzzle.next")}
                  skipLabel={t("practice.puzzle.skip")}
                  onCorrect={(hintUsed, retried) => {
                    if (!hintUsed) {
                      reviewEntry(current.entry.id, retried ? 4 : 5, "puzzle")
                        .then(updated => { if (updated) handleReviewed(current.entry, updated); });
                    }
                    handleNext();
                  }}
                  onSkip={(hintUsed) => {
                    if (!hintUsed) {
                      reviewEntry(current.entry.id, 0, "puzzle")
                        .then(updated => { if (updated) handleReviewed(current.entry, updated); });
                    }
                    handleNext();
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Done: results ───────────────────────────────────────── */}
      {phase === "done" && (() => {
        const masteredUp = reviewResults.filter(r =>
          (r.after.mastery_level ?? 0) > (r.before.mastery_level ?? 0)
        ).length;
        const soon  = reviewResults.filter(r => (r.after.interval_days ?? 1) <= 1).length;
        const week  = reviewResults.filter(r => { const d = r.after.interval_days ?? 1; return d > 1 && d <= 7; }).length;
        const later = reviewResults.filter(r => (r.after.interval_days ?? 1) > 7).length;
        const hasNextReview = soon + week + later > 0;
        const isLoading = remainingDue === null;
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
            <span className="text-5xl">🎉</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("practice.due.done")}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {t("practice.due.reviewed", { count: queue.length })}
              </p>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center gap-2 py-1">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400 dark:text-gray-500">{t("practice.due.calculatingResults")}</p>
              </div>
            ) : (
              <>
                {/* ── Stats ── */}
                {(masteredUp > 0 || hasNextReview) && (
                  <div className="w-full flex flex-col gap-3">
                    {masteredUp > 0 && (
                      <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>↑</span>
                        <span>{t("practice.due.masteredUp", { count: masteredUp })}</span>
                      </div>
                    )}
                    {hasNextReview && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 flex flex-col gap-1.5">
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                          {t("practice.due.nextReviewLabel")}
                        </p>
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
                          {soon  > 0 && <span><span className="font-semibold">{soon}</span>  {t("practice.due.nextSoon")}</span>}
                          {week  > 0 && <span><span className="font-semibold">{week}</span>  {t("practice.due.nextWeek")}</span>}
                          {later > 0 && <span><span className="font-semibold">{later}</span> {t("practice.due.nextLater")}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 flex-wrap justify-center">
                  {remainingDue > 0 && (
                    <Button variant="secondary" onClick={startSession}>
                      {t("practice.quiz.tryAgain")}
                    </Button>
                  )}
                  <Button onClick={() => navigate("/practice")}>{t("practice.backToPractice")}</Button>
                </div>
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}
