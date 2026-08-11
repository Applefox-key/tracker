import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { usePracticeEntries, usePracticeTags, shuffle } from "@/features/practice/hooks/usePracticeEntries";
import { PracticeFilterPanel } from "@/features/practice/components/PracticeFilterPanel";
import { PracticeHelpModal } from "@/features/practice/components/PracticeHelpModal";
import { Button } from "@/shared/ui/Button";
import { SideDrawer } from "@/shared/ui/SideDrawer";
import type { Entry, EntryCategory } from "@/features/entries/types";
import { useEntryCrud } from "@/hooks/useEntryCrud";
import { TfiPanel } from "react-icons/tfi";

interface MatchCard {
  id: string;
  entryId: number;
  type: "word" | "explanation";
  text: string;
}

const ROUND_SIZE = 6;

function buildColumns(entries: Entry[]): { words: MatchCard[]; explanations: MatchCard[] } {
  return {
    words: shuffle(entries.map((e) => ({ id: `w-${e.id}`, entryId: e.id, type: "word" as const, text: e.word }))),
    explanations: shuffle(
      entries.map((e) => ({ id: `e-${e.id}`, entryId: e.id, type: "explanation" as const, text: e.explanation })),
    ),
  };
}

type Phase = "idle" | "playing" | "done";

export function MatchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const allTags = usePracticeTags();

  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [showHelp, setShowHelp] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [roundStart, setRoundStart] = useState(0);
  const [wordCards, setWordCards] = useState<MatchCard[]>([]);
  const [explanationCards, setExplanationCards] = useState<MatchCard[]>([]);
  const [selectedWord, setSelectedWord] = useState<MatchCard | null>(null);
  const [selectedExplanation, setSelectedExplanation] = useState<MatchCard | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [totalMatched, setTotalMatched] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [wrongEntryIds, setWrongEntryIds] = useState<Set<number>>(new Set());
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [matchedPairsList, setMatchedPairsList] = useState<Array<{ word: string; explanation: string }>>([]);

  const { reviewEntry } = useEntryCrud();

  const filteredEntries = usePracticeEntries("match", { selectedRatings, selectedCategory, selectedTag });

  useEffect(() => {
    if (phase !== "playing") return;
    if (canStart) startSession();
    else setPhase("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRatings, selectedCategory, selectedTag]);

  const activeFilterCount = [selectedRatings.length > 0, selectedCategory !== null, selectedTag !== null].filter(
    Boolean,
  ).length;

  const roundEntries = allEntries.slice(roundStart, roundStart + ROUND_SIZE);
  const roundSize = roundEntries.length;
  const roundComplete = matched.size === roundSize && roundSize > 0 && exitingIds.size === 0;
  const totalPairs = allEntries.length;
  const overallProgress = totalPairs > 0 ? Math.round(((totalMatched + matched.size) / totalPairs) * 100) : 0;

  useEffect(() => {
    if (phase !== "playing" || roundEntries.length === 0) return;
    const { words, explanations } = buildColumns(roundEntries);
    setWordCards(words);
    setExplanationCards(explanations);
    setSelectedWord(null);
    setSelectedExplanation(null);
    setWrongIds(new Set());
    setMatched(new Set());
    setExitingIds(new Set());
    setMatchedPairsList([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundStart, allEntries]);

  useEffect(() => {
    if (!selectedWord || !selectedExplanation) return;
    if (selectedWord.entryId === selectedExplanation.entryId) {
      const id = selectedWord.entryId;
      const wId = selectedWord.id;
      const eId = selectedExplanation.id;
      const pair = { word: selectedWord.text, explanation: selectedExplanation.text };
      setMatched((prev) => new Set([...prev, id]));
      setExitingIds((prev) => new Set([...prev, wId, eId]));
      reviewEntry(id, wrongEntryIds.has(id) ? 3 : 5, "match");
      setSelectedWord(null);
      setSelectedExplanation(null);
      setTimeout(() => {
        setExitingIds((prev) => {
          const next = new Set(prev);
          next.delete(wId);
          next.delete(eId);
          return next;
        });
        setMatchedPairsList((prev) => [...prev, pair]);
      }, 480);
    } else {
      setTotalErrors((prev) => prev + 1);
      setWrongEntryIds((prev) => new Set([...prev, selectedWord.entryId, selectedExplanation.entryId]));
      setWrongIds(new Set([selectedWord.id, selectedExplanation.id]));
      setTimeout(() => {
        setWrongIds(new Set());
        setSelectedWord(null);
        setSelectedExplanation(null);
      }, 600);
    }
  }, [selectedWord, selectedExplanation]);

  function clearFilters() {
    setSelectedRatings([]);
    setSelectedCategory(null);
    setSelectedTag(null);
  }

  function startSession() {
    const shuffled = shuffle(filteredEntries);
    setAllEntries(shuffled);
    setRoundStart(0);
    setTotalMatched(0);
    setTotalErrors(0);
    setWrongEntryIds(new Set());
    setPhase("playing");
  }

  function handleWordClick(card: MatchCard) {
    if (matched.has(card.entryId) || wrongIds.size > 0) return;
    setSelectedWord((prev) => (prev?.id === card.id ? null : card));
  }

  function handleExplanationClick(card: MatchCard) {
    if (matched.has(card.entryId) || wrongIds.size > 0) return;
    setSelectedExplanation((prev) => (prev?.id === card.id ? null : card));
  }

  function retryMistakes() {
    const wrongEntriesList = allEntries.filter((e) => wrongEntryIds.has(e.id));
    setAllEntries(shuffle(wrongEntriesList));
    setRoundStart(0);
    setTotalMatched(0);
    setTotalErrors(0);
    setWrongEntryIds(new Set());
    setPhase("playing");
  }

  function advanceRound() {
    const nextTotalMatched = totalMatched + roundSize;
    setTotalMatched(nextTotalMatched);
    const nextRoundStart = roundStart + ROUND_SIZE;
    if (nextRoundStart >= allEntries.length) setPhase("done");
    else setRoundStart(nextRoundStart);
  }

  function cardCls(card: MatchCard, selectedId: string | undefined, isExiting = false): string {
    const isMatched = !isExiting && matched.has(card.entryId);
    const isSelected = selectedId === card.id;
    const isWrong = wrongIds.has(card.id);
    const base =
      "relative w-full rounded-xl border px-3 py-2.5 text-left transition-all duration-150 select-none min-h-[4.5rem] sm:min-h-0 ";
    if (isMatched)
      return (
        base +
        "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 cursor-default opacity-60"
      );
    if (isWrong)
      return base + "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-400 cursor-default";
    if (isSelected)
      return (
        base +
        "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm cursor-pointer"
      );
    if (card.type === "word")
      return (
        base +
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/60 text-gray-800 dark:text-gray-200 cursor-pointer" +
        (isTouchDevice
          ? ""
          : " hover:border-blue-400 hover:bg-blue-100/60 dark:hover:border-blue-500 dark:hover:bg-blue-900/40")
      );
    return (
      base +
      "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/60 text-gray-800 dark:text-gray-200 cursor-pointer" +
      (isTouchDevice
        ? ""
        : " hover:border-violet-400 hover:bg-violet-100/60 dark:hover:border-violet-500 dark:hover:bg-violet-900/40")
    );
  }

  const isTouchDevice = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  const filtersTitle = t("practice.filters") + (activeFilterCount > 0 ? ` (${activeFilterCount})` : "");
  const canStart = filteredEntries.length >= 2;

  return (
    <>
      <style>{`
        @keyframes match-shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-7px); }
          40%     { transform: translateX(7px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
        .match-shake { animation: match-shake 0.5s ease; }

        @keyframes match-exit {
          0%   { opacity: 1; transform: scale(1);    max-height: 200px; }
          40%  { opacity: 0; transform: scale(0.88); max-height: 200px; }
          100% { opacity: 0; transform: scale(0.88); max-height: 0; padding-top: 0; padding-bottom: 0; border-top-width: 0; border-bottom-width: 0; }
        }
        .match-exit {
          animation: match-exit 0.48s ease forwards;
          overflow: hidden;
          pointer-events: none;
        }

        @keyframes pair-enter {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pair-enter { animation: pair-enter 0.35s ease forwards; }
      `}</style>

      <div className="flex flex-col gap-4">
        <PracticeHelpModal
          open={showHelp}
          onClose={() => setShowHelp(false)}
          title={t("practice.match.title")}
          howToPlayLabel={t("practice.helpModal.howToPlay")}
          description={t("practice.match.helpDesc")}
          closeLabel={t("practice.helpModal.close")}
        />

        {/* ── Header (always visible) ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
          <div className="flex items-start gap-3 min-w-0 pb-2 pt-[1rem]">
            <Button onClick={() => navigate("/practice")}>
              <FaArrowLeft />
              {t("practice.match.backToPractice")}
            </Button>
            <div className="min-w-0 ">
              <div className="flex items-center gap-1.5">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("practice.match.title")}</h1>
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

          <div className="hidden sm:flex items-center gap-2 sm:ml-auto">
            <Button variant={showFilters ? "primary" : "secondary"} size="sm" onClick={() => setShowFilters((v) => !v)}>
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
            />
          </div>
        )}

        {/* Mobile filter sidebar */}
        <SideDrawer
          open={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          onOpen={() => setIsMobileDrawerOpen(true)}
          tabLabel={t("practice.filters")}
          tabIcon={<TfiPanel className="text-xl" />}
          title={filtersTitle}
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
            inDrawer
          />
        </SideDrawer>

        {/* ── Idle: start prompt ──────────────────────────────────── */}
        {phase === "idle" && (
          <div className="flex flex-col items-center gap-4 py-8 pb-28 sm:pb-8 max-w-xl mx-auto w-full">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed max-w-sm">
              {t("practice.match.helpDesc")}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t("practice.entriesAvailable", { count: filteredEntries.length })}
            </p>
            {filteredEntries.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
                {t("practice.puzzle.noMatchingEntries")}
              </p>
            )}
            {filteredEntries.length > 0 && !canStart && (
              <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
                {t("practice.match.needAtLeast2")}
              </p>
            )}
            {canStart && (
              <Button onClick={startSession} size="lg" className="hidden sm:flex">
                {t("practice.match.startMatch")}
              </Button>
            )}

            {/* Mobile: full-width sticky bottom button */}
            {canStart && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 sm:hidden z-10">
                <Button onClick={startSession} size="lg" className="w-full h-14 text-base">
                  {t("practice.match.startMatch")}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Playing ─────────────────────────────────────────────── */}
        {phase === "playing" && (
          <div className="flex flex-col gap-5 max-w-2xl mx-auto w-full">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t("practice.match.progressLabel", { matched: totalMatched + matched.size, total: totalPairs })}
              </span>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide text-center">
                {t("practice.match.wordsCol")}
              </p>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide text-center">
                {t("practice.match.explanationsCol")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                {wordCards.map((card) => {
                  if (matched.has(card.entryId) && !exitingIds.has(card.id)) return null;
                  const isExiting = exitingIds.has(card.id);
                  const isWrong = wrongIds.has(card.id);
                  return (
                    <div key={card.id} className={isExiting ? "match-exit" : ""}>
                      <button
                        onClick={() => handleWordClick(card)}
                        disabled={matched.has(card.entryId) || wrongIds.size > 0}
                        className={[cardCls(card, selectedWord?.id, isExiting), isWrong ? "match-shake" : ""].join(
                          " ",
                        )}>
                        <span className="text-base font-semibold leading-snug block pr-4">{card.text}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col gap-2">
                {explanationCards.map((card) => {
                  if (matched.has(card.entryId) && !exitingIds.has(card.id)) return null;
                  const isExiting = exitingIds.has(card.id);
                  const isWrong = wrongIds.has(card.id);
                  return (
                    <div key={card.id} className={isExiting ? "match-exit" : ""}>
                      <button
                        onClick={() => handleExplanationClick(card)}
                        disabled={matched.has(card.entryId) || wrongIds.size > 0}
                        className={[
                          cardCls(card, selectedExplanation?.id, isExiting),
                          isWrong ? "match-shake" : "",
                        ].join(" ")}>
                        <span className="text-sm leading-snug block pr-4">{card.text}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {!roundComplete && matched.size === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">{t("practice.match.selectHint")}</p>
            )}

            {matchedPairsList.length > 0 && (
              <div className="flex flex-col gap-3 mt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0">
                    {t("practice.match.matchedPairs", { count: matchedPairsList.length })}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="flex flex-col gap-2">
                  {matchedPairsList.map((pair, i) => (
                    <div key={i} className="pair-enter flex flex-col gap-1">
                      <div className="flex sm:justify-start relative">
                        <div className="relative w-full sm:w-auto sm:max-w-[65%] bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg sm:rounded-2xl sm:rounded-tl-sm px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                          {pair.word}
                        </div>{" "}
                        <span className="absolute top-1.5 right-2 text-green-500 text-xs leading-none">✓</span>
                      </div>
                      <div className="flex sm:justify-end relative ">
                        <div className="w-full sm:w-auto sm:max-w-[65%] bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50 rounded-lg sm:rounded-2xl sm:rounded-tr-sm px-3 py-2 text-sm text-gray-600 dark:text-gray-300 sm:text-right">
                          {pair.explanation}
                        </div>
                      </div>{" "}
                      <hr className="border-gray-200 dark:border-gray-700"></hr>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {roundComplete && (
              <>
                <div className="h-20 sm:hidden" />
                <div className="fixed bottom-0 left-0 right-0 sm:static bg-white dark:bg-gray-900 sm:bg-transparent border-t border-gray-200 dark:border-gray-700 sm:border-0 p-4 sm:p-0 sm:flex sm:flex-col sm:items-center sm:gap-4 sm:py-4 z-50">
                  <p className="text-green-600 dark:text-green-400 font-semibold text-center mb-2 sm:mb-0">
                    {roundStart + ROUND_SIZE >= allEntries.length
                      ? t("practice.match.allPairsMatched")
                      : t("practice.match.roundComplete")}
                  </p>
                  <Button onClick={advanceRound} className="w-full sm:w-auto">
                    {roundStart + ROUND_SIZE >= allEntries.length
                      ? t("practice.match.seeResults")
                      : t("practice.match.nextRound")}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Done: results ───────────────────────────────────────── */}
        {phase === "done" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
            <span className="text-5xl">🎉</span>
            <div className="flex flex-col gap-3 w-full">
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalPairs}</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t("practice.match.pairsMatched")}</p>
              </div>
              <div>
                <p
                  className={`text-3xl font-bold ${totalErrors === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                  {totalErrors}
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t("practice.match.mistakes")}</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button variant="secondary" onClick={startSession}>
                {t("practice.match.playAgain")}
              </Button>
              {wrongEntryIds.size >= 2 && (
                <Button variant="secondary" onClick={retryMistakes}>
                  {t("practice.retryMistakes", { count: wrongEntryIds.size })}
                </Button>
              )}
              <Button onClick={() => navigate("/practice")}>{t("practice.match.backToPractice")}</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
