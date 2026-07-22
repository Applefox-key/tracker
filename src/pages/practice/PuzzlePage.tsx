import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { usePracticeEntries, usePracticeTags, shuffle, wordCount } from "@/features/practice/hooks/usePracticeEntries";
import { PracticeFilterPanel } from "@/features/practice/components/PracticeFilterPanel";
import { Button } from "@/shared/ui/Button";
import { SideDrawer } from "@/shared/ui/SideDrawer";
import { EntryImage } from "@/shared/ui/EntryImage";
import { getEntryImageUrl } from "@/api/api";
import type { Entry, EntryCategory } from "@/features/entries/types";
import { useEntryCrud } from "@/hooks/useEntryCrud";

const LS_PUZZLE_SHOW_IMAGES = "puzzle_show_images";

interface Tile {
  id: string;
  value: string;
}
type AnswerPhase = "thinking" | "correct" | "wrong";
type Phase = "idle" | "playing" | "done";

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const allTags = usePracticeTags();

  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showImages, setShowImages] = useState(() => localStorage.getItem(LS_PUZZLE_SHOW_IMAGES) === "true");

  function toggleShowImages() {
    const next = !showImages;
    setShowImages(next);
    localStorage.setItem(LS_PUZZLE_SHOW_IMAGES, String(next));
  }

  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<Entry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [pool, setPool] = useState<Tile[]>([]);
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [tileMode, setTileMode] = useState<"letter" | "word">("letter");
  const [answerPhase, setAnswerPhase] = useState<AnswerPhase>("thinking");
  const [score, setScore] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const [hasRetried, setHasRetried] = useState(false);

  const { reviewEntry } = useEntryCrud();

  const filteredEntries = usePracticeEntries("puzzle", { selectedRatings, selectedCategory, selectedTag });

  useEffect(() => {
    if (phase !== "playing") return;
    if (canStart) startSession();
    else setPhase("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRatings, selectedCategory, selectedTag]);

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
    setShowExample(false);
  }, [currentIdx, questions]);

  useEffect(() => {
    if (!currentEntry || answerPhase !== "thinking") return;
    const tLen = targetLength(currentEntry);
    if (placed.length === tLen) {
      const correct = checkAnswer(placed, currentEntry, tileMode);
      if (correct) {
        setScore((n) => n + 1);
        setAnswerPhase("correct");
        reviewEntry(currentEntry.id, hasRetried ? 4 : 5, "puzzle");
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
    setPhase("playing");
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
    setHasRetried(true);
  }

  function handleNext() {
    if (answerPhase === "wrong" && currentEntry) {
      reviewEntry(currentEntry.id, 0, "puzzle");
    }
    setHasRetried(false);
    if (currentIdx + 1 >= questions.length) setPhase("done");
    else setCurrentIdx((i) => i + 1);
  }

  const filtersTitle = t("practice.filters") + (activeFilterCount > 0 ? ` (${activeFilterCount})` : "");
  const canStart = filteredEntries.length > 0;
  const progress = questions.length > 0 ? Math.round((currentIdx / questions.length) * 100) : 0;
  const resultPct = phase === "done" && questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const tLen = currentEntry ? targetLength(currentEntry) : 0;

  const btnInactive =
    "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header (always visible) ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <button
            onClick={() => navigate("/practice")}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-1 shrink-0">
            <FaArrowLeft />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("practice.puzzle.title")}</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t("practice.puzzle.modeDesc")}</p>
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
          />
        </div>
      )}

      {/* Mobile filter sidebar */}
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

      {/* ── Idle: start prompt ──────────────────────────────────── */}
      {phase === "idle" && (
        <div className="flex flex-col items-center gap-4 py-8 max-w-xl mx-auto w-full">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t("practice.entriesAvailable", { count: filteredEntries.length })}
          </p>
          {!canStart && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
              {t("practice.puzzle.noMatchingEntries")}
            </p>
          )}
          {canStart && (
            <Button onClick={startSession} size="lg">
              {t("practice.puzzle.startPuzzle")}
            </Button>
          )}
        </div>
      )}

      {/* ── Playing ─────────────────────────────────────────────── */}
      {phase === "playing" && currentEntry && (
        <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
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
              {currentIdx + 1} / {questions.length}
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-3">
            <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">
              {tileMode === "letter" ? t("practice.puzzle.spellWord") : t("practice.puzzle.arrangeWords")}
            </span>
            <div className="flex items-start gap-4">
              <p className="flex-1 text-base font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
                {currentEntry.explanation}
              </p>
              {showImages && currentEntry.img && (
                <EntryImage
                  src={getEntryImageUrl(currentEntry.img)}
                  alt=""
                  className="rounded-lg border border-gray-200 dark:border-gray-600 shrink-0"
                  style={{ maxWidth: 100, maxHeight: 80, objectFit: "contain" }}
                />
              )}
            </div>
            {currentEntry.example &&
              (showExample ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic border-l-2 border-emerald-200 dark:border-emerald-700 pl-3">
                  {currentEntry.example}
                </p>
              ) : (
                <button
                  onClick={() => setShowExample(true)}
                  className="text-sm text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 text-left transition-colors">
                  {t("practice.puzzle.showExample")}
                </button>
              ))}
          </div>

          <div
            className={[
              "min-h-[64px] rounded-xl border-2 p-3 flex flex-wrap gap-2 items-center transition-colors",
              answerPhase === "correct"
                ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                : answerPhase === "wrong"
                  ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                  : "border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-900/10",
            ].join(" ")}>
            {placed.length === 0 && answerPhase === "thinking" && (
              <span className="text-sm text-emerald-300 dark:text-emerald-700 italic">
                {t("practice.puzzle.clickTiles")}
              </span>
            )}
            {placed.map((tile) => (
              <button
                key={tile.id}
                onClick={() => removePlaced(tile)}
                className="min-h-[3rem] min-w-[3rem] px-4 py-2 rounded-lg bg-emerald-600 text-white text-base font-medium hover:bg-emerald-700 active:bg-emerald-800 transition-colors touch-manipulation">
                {tile.value}
              </button>
            ))}
            {answerPhase === "correct" && (
              <span className="ml-auto text-green-600 dark:text-green-400 font-semibold text-sm">
                {t("practice.puzzle.correct")}
              </span>
            )}
            {answerPhase === "wrong" && (
              <span className="ml-auto text-red-600 dark:text-red-400 font-semibold text-sm">
                {t("practice.puzzle.wrongFeedback")}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {pool.map((tile) => (
              <button
                key={tile.id}
                onClick={() => placeTile(tile)}
                disabled={answerPhase !== "thinking"}
                className="text-xl min-h-[3.5rem] min-w-[3.5rem] px-4 py-2.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-200 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:bg-emerald-100 transition-colors disabled:opacity-40 touch-manipulation">
                {tile.value}
              </button>
            ))}
            {pool.length === 0 && answerPhase === "thinking" && (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                {t("practice.puzzle.allTilesPlaced")}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            {t("practice.puzzle.tilesPlaced", { placed: placed.length, total: tLen })}
          </p>

          {answerPhase === "wrong" && (
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={tryAgain}>
                {t("practice.puzzle.tryAgain")}
              </Button>
              <Button onClick={handleNext}>
                {currentIdx + 1 < questions.length ? t("practice.puzzle.skip") : t("practice.puzzle.finish")}
              </Button>
            </div>
          )}
          {answerPhase === "correct" && (
            <div className="flex justify-end">
              <Button onClick={handleNext}>
                {currentIdx + 1 < questions.length ? t("practice.puzzle.next") : t("practice.puzzle.seeResults")}
              </Button>
            </div>
          )}
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
            <Button onClick={() => navigate("/practice")}>{t("practice.puzzle.backToPractice")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
