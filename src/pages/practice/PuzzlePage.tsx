import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePracticeEntries, usePracticeTags, shuffle, wordCount } from "@/features/practice/hooks/usePracticeEntries";
import { PracticeFilterPanel } from "@/features/practice/components/PracticeFilterPanel";
import { Button } from "@/shared/ui/Button";
import type { Entry, EntryCategory } from "@/features/entries/types";

interface Tile {
  id: string;
  value: string;
}
type AnswerPhase = "thinking" | "correct" | "wrong";

function randomLetter(): string {
  return String.fromCharCode(97 + Math.floor(Math.random() * 26));
}

function buildTiles(entry: Entry): { tiles: Tile[]; mode: "letter" | "word" } {
  const wc = wordCount(entry.word);
  if (wc === 1) {
    const letters = entry.word
      .toLowerCase()
      .split("")
      .map((c, i) => ({ id: `l${i}`, value: c }));
    const extras = [
      { id: "ex0", value: randomLetter() },
      { id: "ex1", value: randomLetter() },
    ];
    return { tiles: shuffle([...letters, ...extras]), mode: "letter" };
  }
  const words = entry.word
    .trim()
    .split(/\s+/)
    .map((w, i) => ({ id: `w${i}`, value: w }));
  return { tiles: shuffle(words), mode: "word" };
}

function checkAnswer(placed: Tile[], entry: Entry, mode: "letter" | "word"): boolean {
  if (mode === "letter") return placed.map((t) => t.value).join("") === entry.word.toLowerCase();
  return (
    placed
      .map((t) => t.value)
      .join(" ")
      .toLowerCase() === entry.word.toLowerCase()
  );
}

function targetLength(entry: Entry): number {
  return wordCount(entry.word) === 1 ? entry.word.length : wordCount(entry.word);
}

export function PuzzlePage() {
  const navigate = useNavigate();
  const allTags = usePracticeTags();

  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [questions, setQuestions] = useState<Entry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [pool, setPool] = useState<Tile[]>([]);
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [tileMode, setTileMode] = useState<"letter" | "word">("letter");
  const [answerPhase, setAnswerPhase] = useState<AnswerPhase>("thinking");
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const filteredEntries = usePracticeEntries("puzzle", { selectedRatings, selectedCategory, selectedTag });

  const activeFilterCount = [selectedRatings.length > 0, selectedCategory !== null, selectedTag !== null].filter(
    Boolean,
  ).length;

  const currentEntry = questions[currentIdx] ?? null;

  useEffect(() => {
    if (!currentEntry) return;
    const { tiles, mode } = buildTiles(currentEntry);
    setPool(tiles);
    setPlaced([]);
    setTileMode(mode);
    setAnswerPhase("thinking");
  }, [currentIdx, questions]);

  useEffect(() => {
    if (!currentEntry || answerPhase !== "thinking") return;
    const tLen = targetLength(currentEntry);
    if (placed.length === tLen) {
      const correct = checkAnswer(placed, currentEntry, tileMode);
      if (correct) {
        setScore((n) => n + 1);
        setAnswerPhase("correct");
      } else setAnswerPhase("wrong");
    }
  }, [placed, currentEntry, tileMode, answerPhase]);

  function clearFilters() {
    setSelectedRatings([]);
    setSelectedCategory(null);
    setSelectedTag(null);
  }

  function startSession() {
    setQuestions(shuffle(filteredEntries));
    setCurrentIdx(0);
    setScore(0);
    setIsDone(false);
    setIsPlaying(true);
  }

  function placeTile(tile: Tile) {
    if (answerPhase !== "thinking") return;
    setPool((p) => p.filter((t) => t.id !== tile.id));
    setPlaced((p) => [...p, tile]);
  }

  function removePlaced(tile: Tile) {
    if (answerPhase !== "thinking") return;
    setPlaced((p) => p.filter((t) => t.id !== tile.id));
    setPool((p) => [...p, tile]);
  }

  function tryAgain() {
    if (!currentEntry) return;
    const { tiles, mode } = buildTiles(currentEntry);
    setPool(tiles);
    setPlaced([]);
    setTileMode(mode);
    setAnswerPhase("thinking");
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) setIsDone(true);
    else setCurrentIdx((i) => i + 1);
  }

  if (!isPlaying) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/practice")} className="text-gray-400 hover:text-gray-600 transition-colors">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Puzzle</h1>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant={showFilters ? "primary" : "secondary"} size="sm" onClick={() => setShowFilters((v) => !v)}>
              <span className="hidden sm:inline">Filters</span>
              <span className="sm:hidden">⚙</span>
              {activeFilterCount > 0 && <span className="ml-1">({activeFilterCount})</span>}
              <span className="text-xs ml-1">{showFilters ? "▲" : "▼"}</span>
            </Button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">
                Clear
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

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
          <span className="text-5xl">🧩</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Puzzle Mode</h2>
            <p className="text-gray-500 mt-1 text-sm">Arrange tiles to form the correct word or phrase</p>
          </div>
          <p className="text-sm text-gray-400">{filteredEntries.length} entries available</p>
          {filteredEntries.length === 0 && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              No matching entries
            </p>
          )}
          <Button onClick={startSession} disabled={filteredEntries.length === 0} size="lg">
            Start Puzzle →
          </Button>
        </div>
      </div>
    );
  }

  if (isDone) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/practice")} className="text-gray-400 hover:text-gray-600 transition-colors">
            ← Practice
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Puzzle — Done!</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
          <span className="text-5xl">{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪"}</span>
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {score} / {questions.length}
            </p>
            <p className="text-gray-500 mt-1">{pct}% solved correctly</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button variant="secondary" onClick={startSession}>
              Try again
            </Button>
            <Button onClick={() => navigate("/practice")}>Back to Practice</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentEntry) return null;

  const progress = Math.round((currentIdx / questions.length) * 100);
  const tLen = targetLength(currentEntry);

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsPlaying(false)}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          ✕ Quit
        </button>
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 shrink-0 tabular-nums">
          {currentIdx + 1} / {questions.length}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-3">
        <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">
          {tileMode === "letter" ? "Spell the word" : "Arrange the words"}
        </span>
        <p className="text-base font-semibold text-gray-800 leading-relaxed">{currentEntry.explanation}</p>
        {currentEntry.example && (
          <p className="text-sm text-gray-500 italic border-l-2 border-emerald-200 pl-3">{currentEntry.example}</p>
        )}
      </div>

      <div
        className={[
          "min-h-[56px] rounded-xl border-2 p-3 flex flex-wrap gap-2 items-center transition-colors",
          answerPhase === "correct"
            ? "border-green-400 bg-green-50"
            : answerPhase === "wrong"
              ? "border-red-400 bg-red-50"
              : "border-dashed border-emerald-300 bg-emerald-50/40",
        ].join(" ")}>
        {placed.length === 0 && answerPhase === "thinking" && (
          <span className="text-sm text-emerald-300 italic">Click tiles below to place them here…</span>
        )}
        {placed.map((tile) => (
          <button
            key={tile.id}
            onClick={() => removePlaced(tile)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 active:bg-emerald-800 transition-colors">
            {tile.value}
          </button>
        ))}
        {answerPhase === "correct" && <span className="ml-auto text-green-600 font-semibold text-sm">✓ Correct!</span>}
        {answerPhase === "wrong" && <span className="ml-auto text-red-600 font-semibold text-sm">✗ Try again</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {pool.map((tile) => (
          <button
            key={tile.id}
            onClick={() => placeTile(tile)}
            disabled={answerPhase !== "thinking"}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 active:bg-emerald-100 transition-colors disabled:opacity-40">
            {tile.value}
          </button>
        ))}
        {pool.length === 0 && answerPhase === "thinking" && (
          <span className="text-xs text-gray-400 italic">All tiles placed — checking…</span>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        {placed.length} / {tLen} tiles placed
      </p>

      {answerPhase === "wrong" && (
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={tryAgain}>
            Try again
          </Button>
          <Button onClick={handleNext}>{currentIdx + 1 < questions.length ? "Skip →" : "Finish"}</Button>
        </div>
      )}
      {answerPhase === "correct" && (
        <div className="flex justify-end">
          <Button onClick={handleNext}>{currentIdx + 1 < questions.length ? "Next →" : "See results"}</Button>
        </div>
      )}
    </div>
  );
}
