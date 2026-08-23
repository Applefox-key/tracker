import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { TfiPanel } from "react-icons/tfi";
import { useEntryCrud } from "@/hooks/useEntryCrud";
import { useEntriesStore } from "@/features/entries/store/entriesStore";
import { Button } from "@/shared/ui/Button";
import { AnswerDiff, normalizeAnswer } from "@/shared/ui/AnswerDiff";
import { SideDrawer } from "@/shared/ui/SideDrawer";
import { PracticeHelpModal } from "@/features/practice/components/PracticeHelpModal";
import { FlashcardGame } from "@/features/practice/components/FlashcardGame";
import { QuizGame } from "@/features/practice/components/QuizGame";
import { PuzzleGame } from "@/features/practice/components/PuzzleGame";
import { PracticeFilterPanel } from "@/features/practice/components/PracticeFilterPanel";
import { usePracticeTags, shuffle, wordCount } from "@/features/practice/hooks/usePracticeEntries";
import type { PracticeFilters, MasteryFilter } from "@/features/practice/hooks/usePracticeEntries";
import type { Entry } from "@/features/entries/types";

type CustomMode = "flashcard" | "quiz" | "puzzle" | "write";
type Phase = "idle" | "playing" | "done";

interface QueueItem {
  entry: Entry;
  mode: CustomMode;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function isPuzzleable(entry: Entry): boolean {
  if (["note", "grammar"].includes(entry.category)) return false;
  return wordCount(entry.word) <= 10;
}

function isWriteable(entry: Entry): boolean {
  return ["word", "phrase", "idiom"].includes(entry.category);
}

function applyFilters(entries: Entry[], f: PracticeFilters): Entry[] {
  return entries.filter((e) => {
    if (!e.includeInPractice) return false;
    if (f.selectedRatings.length && !f.selectedRatings.includes(e.rating)) return false;
    if (f.selectedCategory !== null && e.category !== f.selectedCategory) return false;
    if (f.selectedTag !== null && !e.tags.some((t) => t.id === f.selectedTag)) return false;
    if (f.masteryFilter === 'unmastered' && e.rating >= 5) return false;
    if (f.masteryFilter === 'mastered' && e.rating < 5) return false;
    return true;
  });
}

function buildQueue(entries: Entry[], modes: CustomMode[]): QueueItem[] {
  return entries.map((entry) => {
    if (!entry.last_reviewed_at) return { entry, mode: "flashcard" };
    const valid = modes.filter((m) => {
      if (m === "quiz") return entries.length >= 4;
      if (m === "puzzle") return isPuzzleable(entry);
      if (m === "write") return isWriteable(entry);
      return true;
    });
    const pool = valid.length > 0 ? valid : ["flashcard" as CustomMode];
    return { entry, mode: pool[Math.floor(Math.random() * pool.length)] };
  });
}

// ── WriteItem ─────────────────────────────────────────────────────────────────

function WriteItem({ entry, onNext }: { entry: Entry; onNext: () => void }) {
  const { t } = useTranslation();
  const { reviewEntry } = useEntryCrud();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [answerState, setAnswerState] = useState<"unanswered" | "correct" | "wrong">("unanswered");
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;
      if (answerState === "unanswered") handleSubmit();
      else onNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerState, inputValue]);

  function handleSubmit() {
    if (answerState !== "unanswered" || inputValue.trim() === "") return;
    const isCorrect = normalizeAnswer(inputValue) === normalizeAnswer(entry.word);
    setAnswerState(isCorrect ? "correct" : "wrong");
    if (!showExample) reviewEntry(entry.id, isCorrect ? 5 : 0, "write");
  }

  return (
    <div className="flex flex-col gap-4 pb-28 sm:pb-0">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-3">
        <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">
          {t("practice.write.promptLabel")}
        </span>
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{entry.explanation}</p>
        {entry.example &&
          (showExample ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic border-l-2 border-emerald-200 dark:border-emerald-700 pl-3">
              {entry.example}
            </p>
          ) : (
            <button
              onClick={() => setShowExample(true)}
              className="text-sm text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 text-left transition-colors">
              {t("practice.write.showExample")}
            </button>
          ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={answerState !== "unanswered"}
        placeholder={t("practice.write.typeAnswer")}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        className={[
          "w-full px-4 py-3 rounded-xl border text-base transition-colors outline-none",
          "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
          answerState === "unanswered"
            ? "border-gray-300 dark:border-gray-600 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
            : answerState === "correct"
              ? "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/10"
              : "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10",
        ].join(" ")}
      />

      {answerState === "correct" && (
        <p className="text-base font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
          <span>✓</span> {t("practice.write.correct")}
        </p>
      )}

      {answerState === "wrong" && (
        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
            <span>✗</span> {t("practice.write.wrong")}
          </p>
          <div className="w-full px-4 py-3 rounded-xl border border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10 text-base">
            <AnswerDiff input={inputValue} correct={entry.word} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-700 dark:text-gray-200">{t("practice.write.correctAnswer")}</span>{" "}
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{entry.word}</span>
          </p>
        </div>
      )}

      {answerState === "unanswered" ? (
        <>
          <div className="hidden sm:flex justify-end">
            <Button onClick={handleSubmit} disabled={inputValue.trim() === ""}>
              {t("practice.write.checkAnswer")}
            </Button>
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 sm:hidden z-10">
            <Button onClick={handleSubmit} disabled={inputValue.trim() === ""} className="w-full h-14 text-base">
              {t("practice.write.checkAnswer")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="hidden sm:flex justify-end">
            <Button onClick={onNext}>{t("practice.quiz.next")}</Button>
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 sm:hidden z-10">
            <Button onClick={onNext} className="w-full h-14 text-base">
              {t("practice.quiz.next")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ── CustomPracticePage ────────────────────────────────────────────────────────

const MODE_OPTIONS: CustomMode[] = ["flashcard", "quiz", "puzzle", "write"];
const MODE_ICONS: Record<CustomMode, string> = {
  flashcard: "🃏",
  quiz: "🧠",
  puzzle: "🧩",
  write: "✍️",
};

const EMPTY_FILTERS: PracticeFilters = {
  selectedRatings: [],
  selectedCategory: null,
  selectedTag: null,
  masteryFilter: null,
};

export function CustomPracticePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const allEntries = useEntriesStore((s) => s.entries);
  const allTags = usePracticeTags();
  const { reviewEntry } = useEntryCrud();

  const [filters, setFilters] = useState<PracticeFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedModes, setSelectedModes] = useState<CustomMode[]>(["flashcard", "quiz", "puzzle", "write"]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const filteredEntries = useMemo(() => applyFilters(allEntries, filters), [allEntries, filters]);

  const canStart = filteredEntries.length >= 1;

  function toggleMode(m: CustomMode) {
    setSelectedModes((prev) =>
      prev.includes(m) ? (prev.length > 1 ? prev.filter((x) => x !== m) : prev) : [...prev, m],
    );
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }

  const activeFilterCount = [
    filters.selectedRatings.length > 0,
    filters.selectedCategory !== null,
    filters.selectedTag !== null,
    filters.masteryFilter !== null,
  ].filter(Boolean).length;

  function startSession() {
    const q = buildQueue(shuffle(filteredEntries), selectedModes);
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

  return (
    <div className="flex flex-col gap-4">
      <PracticeHelpModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title={t("practice.custom.title")}
        howToPlayLabel={t("practice.helpModal.howToPlay")}
        description={t("practice.custom.description")}
        settingsLabel={t("practice.helpModal.settings")}
        closeLabel={t("practice.helpModal.close")}
        settings={MODE_OPTIONS.map((m) => ({
          icon: MODE_ICONS[m],
          label: t(`practice.custom.modes.${m}`),
          desc: t(`practice.custom.help${m.charAt(0).toUpperCase() + m.slice(1)}`),
        }))}
      />

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0 pb-2 pt-[1rem]">
          <Button onClick={() => navigate("/practice")}>
            <FaArrowLeft />
            {t("practice.match.backToPractice")}
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("practice.custom.title")}</h1>
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

        {phase === "idle" && (
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap sm:flex-nowrap">
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
              <button
                onClick={clearFilters}
                className="text-xs text-red-500 hover:text-red-700 font-medium hidden sm:block">
                {t("practice.clear")}
              </button>
            )}
          </div>
        )}
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Mobile SideDrawer for filters and filters for PC— visible only during idle */}
      {phase === "idle" && (
        <>
          {showFilters && (
            <div className="hidden sm:block">
              <PracticeFilterPanel
                allTags={allTags}
                selectedCategory={filters.selectedCategory}
                onCategoryChange={(c) => setFilters((f) => ({ ...f, selectedCategory: c }))}
                selectedTag={filters.selectedTag}
                onTagChange={(t) => setFilters((f) => ({ ...f, selectedTag: t }))}
                selectedRatings={filters.selectedRatings}
                onRatingsChange={(r) => setFilters((f) => ({ ...f, selectedRatings: r }))}
                masteryFilter={filters.masteryFilter as MasteryFilter}
                onMasteryFilterChange={(v) => setFilters((f) => ({ ...f, masteryFilter: v }))}
              />
            </div>
          )}{" "}
          {/* Mobile SideDrawer for filters — visible only during idle */}
          <SideDrawer
            open={isMobileDrawerOpen}
            onClose={() => setIsMobileDrawerOpen(false)}
            onOpen={() => setIsMobileDrawerOpen(true)}
            tabLabel={t("practice.filters")}
            tabIcon={<TfiPanel className="text-xl" />}
            title={t("practice.filters") + (activeFilterCount > 0 ? ` (${activeFilterCount})` : "")}
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
              selectedCategory={filters.selectedCategory}
              onCategoryChange={(c) => setFilters((f) => ({ ...f, selectedCategory: c }))}
              selectedTag={filters.selectedTag}
              onTagChange={(t) => setFilters((f) => ({ ...f, selectedTag: t }))}
              selectedRatings={filters.selectedRatings}
              onRatingsChange={(r) => setFilters((f) => ({ ...f, selectedRatings: r }))}
              masteryFilter={filters.masteryFilter as MasteryFilter}
              onMasteryFilterChange={(v) => setFilters((f) => ({ ...f, masteryFilter: v }))}
              inDrawer={true}
            />
          </SideDrawer>
        </>
      )}

      {/* ── Idle ────────────────────────────────────────────────── */}
      {phase === "idle" && (
        <div className="flex flex-col gap-6 max-w-xl mx-auto w-full pb-28 sm:pb-8">
          {/* Mode selection */}
          <div className="flex flex-col gap-3">
            <p className="text-md font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {t("practice.due.selectModes")}
            </p>
            <ul className="flex flex-col gap-3">
              {MODE_OPTIONS.map((m) => (
                <li key={m} className="flex items-start gap-3">
                  <button
                    onClick={() => toggleMode(m)}
                    className={[
                      "shrink-0 mt-0.5 w-6 h-6 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors text-sm sm:text-xs font-bold",
                      selectedModes.includes(m)
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700",
                    ].join(" ")}>
                    {selectedModes.includes(m) ? "✓" : ""}
                  </button>
                  <p className="text-md text-gray-500 dark:text-gray-400 leading-relaxed">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {MODE_ICONS[m]} {t(`practice.custom.modes.${m}`)}
                    </span>
                    {" — "}
                    {t(`practice.custom.help${m.charAt(0).toUpperCase() + m.slice(1)}`)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Entry count + start */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-col items-center gap-3 text-center">
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t("practice.custom.cardsSelected", { count: filteredEntries.length })}
            </p>
            {!canStart && (
              <p className="text-sm text-amber-600 dark:text-amber-400">{t("practice.custom.noEntries")}</p>
            )}
            {canStart && (
              <Button onClick={startSession} size="lg" className="hidden sm:flex">
                {t("practice.custom.start")}
              </Button>
            )}
          </div>

          {/* Mobile sticky start button */}
          {canStart && (
            <div
              className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 sm:hidden z-20"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
              <Button onClick={startSession} size="lg" className="w-full h-14 text-base">
                {t("practice.custom.start")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Playing ─────────────────────────────────────────────── */}
      {phase === "playing" && (
        <div className="flex flex-col gap-5 max-w-xl mx-auto  w-full">
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
                    reviewEntry(current.entry.id, grade, "flashcard", false);
                    handleNext();
                  }}
                />
              )}
              {current.mode === "quiz" && (
                <QuizGame
                  entry={current.entry}
                  pool={filteredEntries}
                  nextLabel={t("practice.quiz.next")}
                  onSelect={(isCorrect, hintUsed) => {
                    if (!hintUsed) reviewEntry(current.entry.id, isCorrect ? 5 : 0, "quiz");
                  }}
                  onNext={handleNext}
                />
              )}
              {current.mode === "puzzle" && (
                <PuzzleGame
                  entry={current.entry}
                  allEntries={filteredEntries}
                  nextLabel={t("practice.puzzle.next")}
                  skipLabel={t("practice.puzzle.skip")}
                  onCorrect={(hintUsed, retried) => {
                    if (!hintUsed) reviewEntry(current.entry.id, retried ? 4 : 5, "puzzle");
                    handleNext();
                  }}
                  onSkip={(hintUsed) => {
                    if (!hintUsed) reviewEntry(current.entry.id, 0, "puzzle");
                    handleNext();
                  }}
                />
              )}
              {current.mode === "write" && <WriteItem entry={current.entry} onNext={handleNext} />}
            </div>
          )}
        </div>
      )}

      {/* ── Done ────────────────────────────────────────────────── */}
      {phase === "done" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
          <span className="text-5xl">🎉</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("practice.due.done")}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t("practice.due.reviewed", { count: queue.length })}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button variant="secondary" onClick={startSession}>
              {t("practice.quiz.tryAgain")}
            </Button>
            <Button onClick={() => navigate("/practice")}>{t("practice.backToPractice")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
