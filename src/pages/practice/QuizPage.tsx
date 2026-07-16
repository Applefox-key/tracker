import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { usePracticeEntries, usePracticeTags, shuffle } from "@/features/practice/hooks/usePracticeEntries";
import { PracticeFilterPanel } from "@/features/practice/components/PracticeFilterPanel";
import { Button } from "@/shared/ui/Button";
import { SideDrawer } from "@/shared/ui/SideDrawer";
import type { Entry, EntryCategory } from "@/features/entries/types";

const LS_QUIZ_MODE = "quiz_start_side";

type Phase = "setup" | "playing" | "done";
type StartSide = "word" | "explanation";

function buildOptions(correct: Entry, pool: Entry[], answerField: "word" | "explanation"): string[] {
  const others = shuffle(pool.filter((e) => e.id !== correct.id))
    .slice(0, 3)
    .map((e) => e[answerField]);
  while (others.length < 3) others.push(`—`);
  return shuffle([correct[answerField], ...others]);
}

function SessionHeader({ current, total, onQuit, quitLabel }: { current: number; total: number; onQuit: () => void; quitLabel: string }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onQuit}
        className="text-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0">
        {quitLabel}
      </button>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-lg text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">
        {current + 1} / {total}
      </span>
    </div>
  );
}

export function QuizPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const allTags = usePracticeTags();

  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [startSide, setStartSide] = useState<StartSide>(() =>
    localStorage.getItem(LS_QUIZ_MODE) === "word" ? "word" : "explanation",
  );

  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<Entry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showExample, setShowExample] = useState(false);

  const filteredEntries = usePracticeEntries("quiz", { selectedRatings, selectedCategory, selectedTag });

  const activeFilterCount = [selectedRatings.length > 0, selectedCategory !== null, selectedTag !== null].filter(
    Boolean,
  ).length;

  const answerField: "word" | "explanation" = startSide === "word" ? "explanation" : "word";

  const currentQuestion = questions[currentIdx] ?? null;
  const options = useMemo(
    () => (currentQuestion ? buildOptions(currentQuestion, questions, answerField) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIdx, questions, answerField],
  );

  function toggleStartSide() {
    const next: StartSide = startSide === "word" ? "explanation" : "word";
    setStartSide(next);
    localStorage.setItem(LS_QUIZ_MODE, next);
  }

  function clearFilters() {
    setSelectedRatings([]);
    setSelectedCategory(null);
    setSelectedTag(null);
  }

  function startSession() {
    setQuestions(shuffle(filteredEntries));
    setCurrentIdx(0);
    setSelected(null);
    setCorrectCount(0);
    setPhase("playing");
  }

  function handleSelect(opt: string) {
    if (selected !== null) return;
    if (opt === questions[currentIdx][answerField]) setCorrectCount((n) => n + 1);
    setSelected(opt);
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) setPhase("done");
    else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setShowExample(false);
    }
  }

  const filtersTitle = t("practice.filters") + (activeFilterCount > 0 ? ` (${activeFilterCount})` : "");

  if (phase === "setup") {
    const canStart = filteredEntries.length >= 4;
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => navigate("/practice")}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("practice.quiz.title")}</h1>
          <div className="flex items-center gap-2 ml-5 w-full sm:w-auto sm:ml-auto">
            <button
              onClick={toggleStartSide}
              title={
                startSide === "word"
                  ? t("practice.quiz.chooseExplanation")
                  : t("practice.quiz.chooseWord")
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
              <span>{startSide === "word" ? "🔤" : "💬"}</span>
              <span>{startSide === "word" ? t("practice.quiz.chooseExplanation") : t("practice.quiz.chooseWord")}</span>
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

        {showFilters && (
          <PracticeFilterPanel
            allTags={allTags}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
            selectedRatings={selectedRatings}
            onRatingsChange={setSelectedRatings}
          />
        )}

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

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
          <span className="text-5xl">🧠</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("practice.quiz.modeName")}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              {startSide === "word" ? t("practice.quiz.descExplanation") : t("practice.quiz.descWord")}
            </p>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t("practice.entriesAvailable", { count: filteredEntries.length })}
          </p>
          {!canStart && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
              {t("practice.quiz.needAtLeast4")}
            </p>
          )}
          <Button onClick={startSession} disabled={!canStart} size="lg">
            {t("practice.quiz.startQuiz")}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/practice")}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {t("practice.backToPractice")}
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("practice.quiz.resultsTitle")}</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
          <span className="text-5xl">{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪"}</span>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {correctCount} / {questions.length}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t("practice.quiz.pctCorrect", { pct })}</p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button variant="secondary" onClick={startSession}>
              {t("practice.quiz.tryAgain")}
            </Button>
            <Button onClick={() => navigate("/practice")}>{t("practice.quiz.backToPractice")}</Button>
          </div>
        </div>
      </div>
    );
  }

  const answered = selected !== null;
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <SessionHeader
        current={currentIdx}
        total={questions.length}
        onQuit={() => setPhase("setup")}
        quitLabel={t("practice.quit")}
      />
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col gap-4">
        <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">
          {startSide === "word" ? t("practice.quiz.promptExplanation") : t("practice.quiz.promptWord")}
        </span>
        <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
          {startSide === "word" ? currentQuestion!.word : currentQuestion!.explanation}
        </p>
        {currentQuestion!.example &&
          (showExample ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic border-l-2 border-emerald-200 dark:border-emerald-700 pl-3">
              {currentQuestion!.example}
            </p>
          ) : (
            <button
              onClick={() => setShowExample(true)}
              className="text-sm text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 text-left transition-colors">
              {t("practice.quiz.showExample")}
            </button>
          ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const isCorrect = opt === currentQuestion![answerField];
          const isSelected = opt === selected;
          let cls = "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ";
          if (!answered)
            cls +=
              "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-200";
          else if (isCorrect)
            cls += "bg-green-50 dark:bg-green-900/20 border-green-400 text-green-800 dark:text-green-400";
          else if (isSelected) cls += "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-800 dark:text-red-400";
          else cls += "bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-400 dark:text-gray-500";
          return (
            <button key={opt} onClick={() => handleSelect(opt)} disabled={answered} className={cls}>
              {opt}
              {answered && isCorrect && " ✓"}
              {answered && isSelected && !isCorrect && " ✗"}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="flex justify-end">
          <Button onClick={handleNext}>
            {currentIdx + 1 < questions.length ? t("practice.quiz.next") : t("practice.quiz.seeResults")}
          </Button>
        </div>
      )}
    </div>
  );
}
