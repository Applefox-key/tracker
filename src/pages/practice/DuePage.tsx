import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { entriesApi } from "@/api/api";
import { useEntryCrud } from "@/hooks/useEntryCrud";
import { useAuthStore } from "@/features/auth/store/authStore";
import { FlashCard } from "@/features/flashcards/components/FlashCard";
import { Button } from "@/shared/ui/Button";
import { shuffle, wordCount } from "@/features/practice/hooks/usePracticeEntries";
import type { Entry, SRGrade } from "@/features/entries/types";
import type { Flashcard } from "@/features/flashcards/types";

type DueMode = "flashcard" | "quiz" | "puzzle";
type Phase = "loading" | "setup" | "playing" | "done";

interface QueueItem {
  entry: Entry;
  mode: DueMode;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function entryToCard(entry: Entry): Flashcard {
  return {
    id: entry.id,
    front: entry.word,
    back: entry.explanation,
    hint: entry.example || undefined,
    rating: entry.rating,
    img: entry.img,
  };
}

function isPuzzleable(entry: Entry): boolean {
  if (["note", "grammar"].includes(entry.category)) return false;
  return wordCount(entry.word) <= 10;
}

function buildQueue(entries: Entry[], modes: DueMode[]): QueueItem[] {
  return entries.map((entry) => {
    // First-time entries always start as flashcard regardless of selected modes
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

// ── SR grade buttons (shared) ─────────────────────────────────────────────────

const GRADES = [
  {
    grade: 0 as SRGrade,
    key: "practice.sr.again",
    cls: "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
  },
  {
    grade: 3 as SRGrade,
    key: "practice.sr.hard",
    cls: "border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20",
  },
  {
    grade: 4 as SRGrade,
    key: "practice.sr.good",
    cls: "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
  },
  {
    grade: 5 as SRGrade,
    key: "practice.sr.easy",
    cls: "border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
  },
] as const;

function GradeButtons({ onGrade }: { onGrade: (g: SRGrade) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-xs text-gray-400 dark:text-gray-500">{t("practice.sr.rateKnowledge")}</p>
      <div className="grid grid-cols-4 gap-2">
        {GRADES.map(({ grade, key, cls }) => (
          <button
            key={grade}
            onClick={() => onGrade(grade)}
            className={`py-2 rounded-xl border text-xs font-semibold transition-colors bg-white dark:bg-gray-800 ${cls}`}>
            {t(key)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── DueFlashcardItem ─────────────────────────────────────────────────────────

function DueFlashcardItem({ entry, onNext }: { entry: Entry; onNext: () => void }) {
  const { t } = useTranslation();
  const { reviewEntry } = useEntryCrud();
  const [isFlipped, setIsFlipped] = useState(false);

  function handleGrade(grade: SRGrade) {
    reviewEntry(entry.id, grade, "flashcard");
    onNext();
  }

  return (
    <div className="flex flex-col gap-4">
      <FlashCard card={entryToCard(entry)} isFlipped={isFlipped} onFlip={() => setIsFlipped((v) => !v)} />
      {isFlipped ? (
        <GradeButtons onGrade={handleGrade} />
      ) : (
        <p className="text-center text-xs text-gray-300 dark:text-gray-600">{t("practice.flashcards.tapHint")}</p>
      )}
    </div>
  );
}

// ── DueQuizItem ──────────────────────────────────────────────────────────────

function DueQuizItem({ entry, pool, onNext }: { entry: Entry; pool: Entry[]; onNext: () => void }) {
  const { t } = useTranslation();
  const { reviewEntry } = useEntryCrud();
  const [selected, setSelected] = useState<string | null>(null);

  const options = useMemo(() => {
    const others = shuffle(pool.filter((e) => e.id !== entry.id))
      .slice(0, 3)
      .map((e) => e.explanation);
    while (others.length < 3) others.push("—");
    return shuffle([entry.explanation, ...others]);
  }, [entry, pool]);

  function handleSelect(opt: string) {
    if (selected !== null) return;
    const isCorrect = opt === entry.explanation;
    setSelected(opt);
    reviewEntry(entry.id, isCorrect ? 5 : 0, "quiz");
  }

  const answered = selected !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-3">
        <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">
          {t("practice.quiz.promptExplanation")}
        </span>
        <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">{entry.word}</p>
        {entry.example && (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic border-l-2 border-emerald-200 dark:border-emerald-700 pl-3">
            {entry.example}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const isCorrect = opt === entry.explanation;
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
          <Button onClick={onNext}>{t("practice.quiz.next")}</Button>
        </div>
      )}
    </div>
  );
}

// ── DuePuzzleItem ────────────────────────────────────────────────────────────

interface Tile {
  id: string;
  value: string;
}
type AnswerPhase = "thinking" | "correct" | "wrong";

function randomLetter() {
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

function DuePuzzleItem({ entry, onNext }: { entry: Entry; onNext: () => void }) {
  const { t } = useTranslation();
  const { reviewEntry } = useEntryCrud();
  const [pool, setPool] = useState<Tile[]>([]);
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [tileMode, setTileMode] = useState<"letter" | "word">("letter");
  const [phase, setPhase] = useState<AnswerPhase>("thinking");
  const [hasRetried, setHasRetried] = useState(false);

  useEffect(() => {
    const { tiles, mode } = buildTiles(entry);
    setPool(tiles);
    setPlaced([]);
    setTileMode(mode);
    setPhase("thinking");
    setHasRetried(false);
  }, [entry]);

  useEffect(() => {
    if (phase !== "thinking" || placed.length === 0) return;
    const tLen = wordCount(entry.word) === 1 ? entry.word.length : wordCount(entry.word);
    if (placed.length === tLen) {
      const correct = checkAnswer(placed, entry, tileMode);
      if (correct) {
        setPhase("correct");
        reviewEntry(entry.id, hasRetried ? 4 : 5, "puzzle");
      } else {
        setPhase("wrong");
      }
    }
  }, [placed, entry, tileMode, phase]);

  function placeTile(tile: Tile) {
    if (phase !== "thinking") return;
    setPool((p) => p.filter((t) => t.id !== tile.id));
    setPlaced((p) => [...p, tile]);
  }

  function removePlaced(tile: Tile) {
    if (phase !== "thinking") return;
    setPlaced((p) => p.filter((t) => t.id !== tile.id));
    setPool((p) => [...p, tile]);
  }

  function tryAgain() {
    const { tiles, mode } = buildTiles(entry);
    setPool(tiles);
    setPlaced([]);
    setTileMode(mode);
    setPhase("thinking");
    setHasRetried(true);
  }

  function handleSkip() {
    reviewEntry(entry.id, 0, "puzzle");
    onNext();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-3">
        <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">
          {tileMode === "letter" ? t("practice.puzzle.spellWord") : t("practice.puzzle.arrangeWords")}
        </span>
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{entry.explanation}</p>
      </div>

      <div
        className={[
          "min-h-[52px] rounded-xl border-2 p-3 flex flex-wrap gap-2 items-center transition-colors",
          phase === "correct"
            ? "border-green-400 bg-green-50 dark:bg-green-900/20"
            : phase === "wrong"
              ? "border-red-400 bg-red-50 dark:bg-red-900/20"
              : "border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-900/10",
        ].join(" ")}>
        {placed.length === 0 && phase === "thinking" && (
          <span className="text-sm text-emerald-300 dark:text-emerald-700 italic">
            {t("practice.puzzle.clickTiles")}
          </span>
        )}
        {placed.map((tile) => (
          <button
            key={tile.id}
            onClick={() => removePlaced(tile)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
            {tile.value}
          </button>
        ))}
        {phase === "correct" && (
          <span className="ml-auto text-green-600 dark:text-green-400 font-semibold text-sm">
            {t("practice.puzzle.correct")}
          </span>
        )}
        {phase === "wrong" && (
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
            disabled={phase !== "thinking"}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-40">
            {tile.value}
          </button>
        ))}
      </div>

      {phase === "wrong" && (
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={tryAgain}>
            {t("practice.puzzle.tryAgain")}
          </Button>
          <Button onClick={handleSkip}>{t("practice.puzzle.skip")}</Button>
        </div>
      )}
      {phase === "correct" && (
        <div className="flex justify-end">
          <Button onClick={onNext}>{t("practice.puzzle.next")}</Button>
        </div>
      )}
    </div>
  );
}

// ── DuePage ──────────────────────────────────────────────────────────────────

const MODE_OPTIONS: DueMode[] = ["flashcard", "quiz", "puzzle"];

export function DuePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authMode = useAuthStore((s) => s.mode);

  const [phase, setPhase] = useState<Phase>("loading");
  const [dueEntries, setDueEntries] = useState<Entry[]>([]);
  const [selectedModes, setSelectedModes] = useState<DueMode[]>(["flashcard", "quiz", "puzzle"]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (authMode !== "authenticated") {
      setPhase("setup");
      return;
    }
    entriesApi
      .getDueEntries()
      .then((entries) => {
        setDueEntries(entries);
        setPhase("setup");
      })
      .catch(() => setPhase("setup"));
  }, [authMode]);

  function toggleMode(m: DueMode) {
    setSelectedModes((prev) =>
      prev.includes(m) ? (prev.length > 1 ? prev.filter((x) => x !== m) : prev) : [...prev, m],
    );
  }

  function startSession() {
    const q = buildQueue(shuffle(dueEntries), selectedModes);
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

  // ── Loading ──
  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-400 dark:text-gray-500">{t("common.loading", "Loading…")}</p>
      </div>
    );
  }

  // ── Setup ──
  if (phase === "setup") {
    const hasDue = dueEntries.length > 0;
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/practice")}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("practice.due.title")}</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
          <span className="text-5xl">📅</span>
          {hasDue ? (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("practice.due.description")}
              </p>

              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {t("practice.due.cardsToReview", { count: dueEntries.length })}
              </p>

              <div className="w-full flex flex-col gap-3 text-left">
                <p className="text-xs font-medium text-gray-500 text-center dark:text-gray-400 uppercase tracking-wide">
                  {t("practice.due.selectModes")}
                </p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {MODE_OPTIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => toggleMode(m)}
                      className={[
                        "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                        selectedModes.includes(m)
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600",
                      ].join(" ")}>
                      {t(`practice.due.modes.${m}`)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  {t("practice.due.newCardsNote")}
                </p>
              </div>

              <Button onClick={startSession} size="lg">
                {t("practice.due.start")}
              </Button>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("practice.due.noDue")}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t("practice.due.noDueHint")}</p>
              </div>
              <Button variant="secondary" onClick={() => navigate("/practice")}>
                {t("practice.backToPractice")}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Done ──
  if (phase === "done") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/practice")}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {t("practice.backToPractice")}
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("practice.due.title")}</h1>
        </div>
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
      </div>
    );
  }

  // ── Playing ──
  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setPhase("setup")}
          className="text-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0">
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
          {current.mode === "flashcard" && <DueFlashcardItem entry={current.entry} onNext={handleNext} />}
          {current.mode === "quiz" && <DueQuizItem entry={current.entry} pool={dueEntries} onNext={handleNext} />}
          {current.mode === "puzzle" && <DuePuzzleItem entry={current.entry} onNext={handleNext} />}
        </div>
      )}
    </div>
  );
}
