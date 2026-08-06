import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { TfiPanel } from "react-icons/tfi";
import { usePracticeEntries, usePracticeTags, shuffle } from "@/features/practice/hooks/usePracticeEntries";
import { PracticeFilterPanel } from "@/features/practice/components/PracticeFilterPanel";
import { PracticeHelpModal } from "@/features/practice/components/PracticeHelpModal";
import { Button } from "@/shared/ui/Button";
import { SideDrawer } from "@/shared/ui/SideDrawer";
import type { Entry, EntryCategory } from "@/features/entries/types";
import { useEntryCrud } from "@/hooks/useEntryCrud";

type Phase = "idle" | "playing" | "done";
type AnswerState = "unanswered" | "correct" | "wrong";

export const WRITE_ALLOWED_CATEGORIES: EntryCategory[] = ["word", "phrase", "idiom"];

function normalizeAnswer(s: string): string {
  return s
    .trim()
    .replace(/[,:]/g, "")
    .replace(/[.?!]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function AnswerDiff({ input, correct }: { input: string; correct: string }) {
  const normInput = normalizeAnswer(input);
  const normCorrect = normalizeAnswer(correct);
  const len = Math.max(normInput.length, normCorrect.length);

  return (
    <span className="font-semibold tracking-wide">
      {Array.from({ length: len }, (_, i) => {
        const u = normInput[i];
        const c = normCorrect[i];
        if (i >= normCorrect.length) {
          return (
            <span key={i} className="text-red-500 dark:text-red-400 line-through opacity-60">
              {u}
            </span>
          );
        }
        if (u === c) {
          return (
            <span key={i} className="text-green-600 dark:text-green-400">
              {u}
            </span>
          );
        }
        return (
          <span key={i} className="text-red-600 dark:text-red-400 underline decoration-red-500 underline-offset-2">
            {u ?? c}
          </span>
        );
      })}
    </span>
  );
}

export function WritePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const allTags = usePracticeTags();
  const inputRef = useRef<HTMLInputElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<Entry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [correctCount, setCorrectCount] = useState(0);
  const [showExample, setShowExample] = useState(false);

  const filteredEntries = usePracticeEntries("write", { selectedRatings, selectedCategory, selectedTag });
  const { reviewEntry } = useEntryCrud();

  const currentQuestion = questions[currentIdx] ?? null;
  const canStart = filteredEntries.length >= 1;
  const progressPct = questions.length > 0 ? Math.round((currentIdx / questions.length) * 100) : 0;
  const resultPct = phase === "done" && questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const activeFilterCount = [selectedRatings.length > 0, selectedCategory !== null, selectedTag !== null].filter(
    Boolean,
  ).length;
  const filtersTitle = t("practice.filters") + (activeFilterCount > 0 ? ` (${activeFilterCount})` : "");

  useEffect(() => {
    if (phase === "playing" && answerState === "unanswered") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [phase, currentIdx, answerState]);

  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;
      if (answerState === "unanswered") handleSubmit();
      else handleNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, answerState, currentIdx, inputValue]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (canStart) startSession();
    else setPhase("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRatings, selectedCategory, selectedTag]);

  function startSession() {
    setQuestions(shuffle(filteredEntries));
    setCurrentIdx(0);
    setInputValue("");
    setAnswerState("unanswered");
    setCorrectCount(0);
    setShowExample(false);
    setPhase("playing");
  }

  function handleSubmit() {
    if (answerState !== "unanswered" || !currentQuestion || inputValue.trim() === "") return;
    const isCorrect = normalizeAnswer(inputValue) === normalizeAnswer(currentQuestion.word);
    setAnswerState(isCorrect ? "correct" : "wrong");
    if (isCorrect) setCorrectCount((n) => n + 1);
    if (!showExample) reviewEntry(currentQuestion.id, isCorrect ? 5 : 0, "write");
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      setPhase("done");
    } else {
      setCurrentIdx((i) => i + 1);
      setInputValue("");
      setAnswerState("unanswered");
      setShowExample(false);
    }
  }

  function clearFilters() {
    setSelectedRatings([]);
    setSelectedCategory(null);
    setSelectedTag(null);
  }

  const filterPanel = (inDrawer = false) => (
    <PracticeFilterPanel
      allTags={allTags}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      selectedTag={selectedTag}
      onTagChange={setSelectedTag}
      selectedRatings={selectedRatings}
      onRatingsChange={setSelectedRatings}
      allowedCategories={WRITE_ALLOWED_CATEGORIES}
      inDrawer={inDrawer}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <PracticeHelpModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title={t("practice.write.title")}
        howToPlayLabel={t("practice.helpModal.howToPlay")}
        description={t("practice.write.helpDesc")}
        closeLabel={t("practice.helpModal.close")}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0 pb-2 pt-[1rem]">
          <Button onClick={() => navigate("/practice")}>
            <FaArrowLeft />
            {t("practice.match.backToPractice")}
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("practice.write.title")}</h1>
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

      {/* Desktop filter panel */}
      {showFilters && <div className="hidden sm:block">{filterPanel()}</div>}

      {/* Mobile filter drawer */}
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
        {filterPanel(true)}
      </SideDrawer>

      {/* ── Idle ────────────────────────────────────────────────── */}
      {phase === "idle" && (
        <div className="flex flex-col items-center gap-5 py-8 pb-28 sm:pb-8 max-w-xl mx-auto w-full">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed max-w-sm">
            {t("practice.write.helpDesc")}
          </p>
          <span className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1 font-medium">
            {t("practice.write.onlyCategories")}
          </span>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t("practice.entriesAvailable", { count: filteredEntries.length })}
          </p>
          {filteredEntries.length === 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 text-center">
              {t("practice.write.noMatchingEntries")}
            </p>
          )}
          {canStart && (
            <Button onClick={startSession} size="lg" className="hidden sm:flex">
              {t("practice.write.startWrite")}
            </Button>
          )}

          {canStart && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 sm:hidden z-10">
              <Button onClick={startSession} size="lg" className="w-full h-14 text-base">
                {t("practice.write.startWrite")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Playing ─────────────────────────────────────────────── */}
      {phase === "playing" && currentQuestion && (
        <div className="flex flex-col gap-5 max-w-xl mx-auto w-full pb-28 sm:pb-0">
          {/* Progress bar */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPhase("idle")}
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0">
              {t("practice.quit")}
            </button>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">
              {currentIdx + 1} / {questions.length}
            </span>
          </div>

          {/* Question card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 sm:p-8 flex flex-col gap-4">
            <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">
              {t("practice.write.promptLabel")}
            </span>
            <p className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100 leading-relaxed">
              {currentQuestion.explanation}
            </p>
            {currentQuestion.example &&
              (showExample ? (
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 italic border-l-2 border-emerald-200 dark:border-emerald-700 pl-3">
                  {currentQuestion.example}
                </p>
              ) : (
                <button
                  onClick={() => setShowExample(true)}
                  className="text-sm text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 text-left transition-colors">
                  {t("practice.write.showExample")}
                </button>
              ))}
          </div>

          {/* Input + feedback */}
          <div className="flex flex-col gap-3">
            {answerState === "wrong" ? (
              <div className="w-full px-4 py-3 sm:py-4 rounded-xl border border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10 text-base sm:text-lg">
                <AnswerDiff input={inputValue} correct={currentQuestion.word} />
              </div>
            ) : (
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
                  "w-full px-4 py-3 sm:py-4 rounded-xl border text-base sm:text-lg transition-colors outline-none",
                  "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                  answerState === "unanswered"
                    ? "border-gray-300 dark:border-gray-600 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
                    : "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/10",
                ].join(" ")}
              />
            )}

            {answerState === "correct" && (
              <p className="text-base font-semibold text-green-600 dark:text-green-400 flex items-center gap-2 px-1">
                <span className="text-xl leading-none">✓</span>
                {t("practice.write.correct")}
              </p>
            )}

            {answerState === "wrong" && (
              <div className="flex flex-col gap-1.5 px-1">
                <p className="text-base font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span className="text-xl leading-none">✗</span>
                  {t("practice.write.wrong")}
                </p>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {t("practice.write.correctAnswer")}
                  </span>{" "}
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{currentQuestion.word}</span>
                </p>
              </div>
            )}
          </div>

          {/* Action button */}
          {answerState === "unanswered" ? (
            <>
              <div className="hidden sm:flex justify-end">
                <Button onClick={handleSubmit} disabled={inputValue.trim() === ""} size="lg" className="text-base">
                  {t("practice.write.checkAnswer")}
                </Button>
              </div>
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 sm:hidden z-10">
                <Button
                  onClick={handleSubmit}
                  disabled={inputValue.trim() === ""}
                  size="lg"
                  className="w-full h-14 text-base">
                  {t("practice.write.checkAnswer")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="hidden sm:flex justify-end">
                <Button ref={nextBtnRef} onClick={handleNext} size="lg" className="text-base">
                  {currentIdx + 1 < questions.length ? t("practice.write.next") : t("practice.write.seeResults")}
                </Button>
              </div>
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 sm:hidden z-10">
                <Button ref={nextBtnRef} onClick={handleNext} size="lg" className="w-full h-14 text-base">
                  {currentIdx + 1 < questions.length ? t("practice.write.next") : t("practice.write.seeResults")}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Done ────────────────────────────────────────────────── */}
      {phase === "done" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
          <span className="text-5xl">{resultPct >= 80 ? "🏆" : resultPct >= 50 ? "👍" : "💪"}</span>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {correctCount} / {questions.length}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t("practice.write.pctCorrect", { pct: resultPct })}
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
              {t("practice.write.tryAgain")}
            </Button>
            <Button onClick={() => navigate("/practice")}>{t("practice.write.backToPractice")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
