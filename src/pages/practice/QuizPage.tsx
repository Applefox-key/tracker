import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePracticeEntries, usePracticeTags, shuffle } from "@/features/practice/hooks/usePracticeEntries";
import { PracticeFilterPanel } from "@/features/practice/components/PracticeFilterPanel";
import { Button } from "@/shared/ui/Button";
import type { Entry, EntryCategory } from "@/features/entries/types";

type Phase = "setup" | "playing" | "done";

function buildOptions(correct: Entry, pool: Entry[]): string[] {
  const others = shuffle(pool.filter((e) => e.id !== correct.id))
    .slice(0, 3)
    .map((e) => e.word);
  while (others.length < 3) others.push(`—`);
  return shuffle([correct.word, ...others]);
}

function SessionHeader({ current, total, onQuit }: { current: number; total: number; onQuit: () => void }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <button onClick={onQuit} className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0">
        ✕ Quit
      </button>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">
        {current + 1} / {total}
      </span>
    </div>
  );
}

export function QuizPage() {
  const navigate = useNavigate();
  const allTags = usePracticeTags();

  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<Entry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showExample, setShowExample] = useState(false);

  const filteredEntries = usePracticeEntries("quiz", { selectedRatings, selectedCategory, selectedTag });

  const activeFilterCount = [selectedRatings.length > 0, selectedCategory !== null, selectedTag !== null].filter(Boolean).length;

  const currentQuestion = questions[currentIdx] ?? null;
  const options = useMemo(
    () => (currentQuestion ? buildOptions(currentQuestion, questions) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIdx, questions],
  );

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
    if (opt === questions[currentIdx].word) setCorrectCount((n) => n + 1);
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

  if (phase === "setup") {
    const canStart = filteredEntries.length >= 4;
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/practice")} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quiz</h1>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant={showFilters ? "primary" : "secondary"} size="sm" onClick={() => setShowFilters((v) => !v)}>
              <span className="hidden sm:inline">Filters</span>
              <span className="sm:hidden">⚙</span>
              {activeFilterCount > 0 && <span className="ml-1">({activeFilterCount})</span>}
              <span className="text-xs ml-1">{showFilters ? "▲" : "▼"}</span>
            </Button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
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

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
          <span className="text-5xl">🧠</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Quiz Mode</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Choose the correct word from 4 options</p>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">{filteredEntries.length} entries available</p>
          {!canStart && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
              Need at least 4 entries to start
            </p>
          )}
          <Button onClick={startSession} disabled={!canStart} size="lg">Start Quiz →</Button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/practice")} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            ← Practice
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quiz — Results</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
          <span className="text-5xl">{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪"}</span>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{correctCount} / {questions.length}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{pct}% correct</p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button variant="secondary" onClick={startSession}>Try again</Button>
            <Button onClick={() => navigate("/practice")}>Back to Practice</Button>
          </div>
        </div>
      </div>
    );
  }

  const answered = selected !== null;
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <SessionHeader current={currentIdx} total={questions.length} onQuit={() => setPhase("setup")} />
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col gap-4">
        <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">What word is this?</span>
        <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">{currentQuestion!.explanation}</p>
        {currentQuestion!.example && (
          showExample
            ? <p className="text-sm text-gray-500 dark:text-gray-400 italic border-l-2 border-emerald-200 dark:border-emerald-700 pl-3">{currentQuestion!.example}</p>
            : <button onClick={() => setShowExample(true)} className="text-sm text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 text-left transition-colors">Show example…</button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const isCorrect = opt === currentQuestion!.word;
          const isSelected = opt === selected;
          let cls = "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ";
          if (!answered)
            cls += "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-200";
          else if (isCorrect)
            cls += "bg-green-50 dark:bg-green-900/20 border-green-400 text-green-800 dark:text-green-400";
          else if (isSelected)
            cls += "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-800 dark:text-red-400";
          else
            cls += "bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-400 dark:text-gray-500";
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
          <Button onClick={handleNext}>{currentIdx + 1 < questions.length ? "Next →" : "See results"}</Button>
        </div>
      )}
    </div>
  );
}
