import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { entriesApi, getEntryImageUrl } from "@/api/api";
import { useEntryCrud } from "@/hooks/useEntryCrud";
import { useAuthStore } from "@/features/auth/store/authStore";
import { FlashCard } from "@/features/flashcards/components/FlashCard";
import { Button } from "@/shared/ui/Button";
import { PracticeHelpModal } from "@/features/practice/components/PracticeHelpModal";
import { shuffle, wordCount } from "@/features/practice/hooks/usePracticeEntries";
import type { Entry, SRGrade } from "@/features/entries/types";
import type { Flashcard } from "@/features/flashcards/types";

type DueMode = "flashcard" | "quiz" | "puzzle";
type Phase = "loading" | "idle" | "playing" | "done";

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
    img: entry.img ? getEntryImageUrl(entry.img) : null,
    category: entry.category,
  };
}

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

// ── SR grade buttons ──────────────────────────────────────────────────────────

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
            className={`py-2.5 sm:py-2 rounded-xl border text-sm sm:text-xs font-semibold transition-colors bg-white dark:bg-gray-800 ${cls}`}>
            {t(key)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── DueFlashcardItem ──────────────────────────────────────────────────────────

function DueFlashcardItem({ entry, onNext }: { entry: Entry; onNext: () => void }) {
  const { t } = useTranslation();
  const { reviewEntry } = useEntryCrud();
  const [isFlipped, setIsFlipped] = useState(false);

  function handleGrade(grade: SRGrade) {
    reviewEntry(entry.id, grade, "flashcard", true);
    onNext();
  }

  return (
    <div className={["flex flex-col gap-4", isFlipped ? "pb-32 sm:pb-0" : ""].join(" ").trim()}>
      <FlashCard
        card={entryToCard(entry)}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped((v) => !v)}
        reversed={true}
      />
      {!isFlipped && (
        <p className="text-center text-xs text-gray-300 dark:text-gray-600">{t("practice.flashcards.tapHint")}</p>
      )}
      {/* Desktop: inline grade buttons */}
      {isFlipped && (
        <div className="hidden sm:block">
          <GradeButtons onGrade={handleGrade} />
        </div>
      )}
      {/* Mobile: fixed bottom grade buttons */}
      {isFlipped && (
        <div
          className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)] px-4 pt-4"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
          <GradeButtons onGrade={handleGrade} />
        </div>
      )}
    </div>
  );
}

// ── DueQuizItem ───────────────────────────────────────────────────────────────

function DueQuizItem({ entry, pool, onNext }: { entry: Entry; pool: Entry[]; onNext: () => void }) {
  const { t } = useTranslation();
  const { reviewEntry } = useEntryCrud();
  const [selected, setSelected] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  const options = useMemo(() => {
    const others = shuffle(pool.filter((e) => e.id !== entry.id))
      .slice(0, 3)
      .map((e) => e.word);
    while (others.length < 3) others.push("—");
    return shuffle([entry.word, ...others]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);

  function handleSelect(opt: string) {
    if (selected !== null) return;
    const isCorrect = opt === entry.word;
    setSelected(opt);
    if (!hintUsed) reviewEntry(entry.id, isCorrect ? 5 : 0, "quiz");
  }

  function handleShowExample() {
    setShowExample(true);
    setHintUsed(true);
  }

  const answered = selected !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-3">
        <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">
          {t("practice.quiz.promptWord")}
        </span>
        <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">{entry.explanation}</p>
        {entry.example &&
          (showExample ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic border-l-2 border-emerald-200 dark:border-emerald-700 pl-3">
              {entry.example}
            </p>
          ) : (
            <button
              onClick={handleShowExample}
              className="text-sm text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 text-left transition-colors">
              {t("practice.write.showExample")}
            </button>
          ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const isCorrect = opt === entry.word;
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

// ── DuePuzzleItem ─────────────────────────────────────────────────────────────

interface Tile {
  id: string;
  value: string;
}
type AnswerPhase = "thinking" | "correct" | "wrong";

function randomLetter() {
  return String.fromCharCode(97 + Math.floor(Math.random() * 26));
}

function buildTiles(entry: Entry, allEntries: Entry[] = []): { tiles: Tile[]; mode: "letter" | "word" } {
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
  const correctSet = new Set(words.map((t) => t.value.toLowerCase()));
  const candidates: string[] = [];
  for (const other of allEntries) {
    if (other.id === entry.id) continue;
    for (const w of other.word.trim().split(/\s+/)) {
      if (!correctSet.has(w.toLowerCase())) candidates.push(w);
    }
  }
  const distractors = shuffle(candidates)
    .slice(0, 3)
    .map((w, i) => ({ id: `d${i}`, value: w }));
  return { tiles: shuffle([...words, ...distractors]), mode: "word" };
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

function DuePuzzleItem({ entry, allEntries, onNext }: { entry: Entry; allEntries: Entry[]; onNext: () => void }) {
  const { t } = useTranslation();
  const { reviewEntry } = useEntryCrud();
  const [pool, setPool] = useState<Tile[]>([]);
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [usedTileIds, setUsedTileIds] = useState<Set<string>>(new Set());
  const [tileMode, setTileMode] = useState<"letter" | "word">("letter");
  const [phase, setPhase] = useState<AnswerPhase>("thinking");
  const [hasRetried, setHasRetried] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  useEffect(() => {
    const { tiles, mode } = buildTiles(entry, allEntries);
    setPool(tiles);
    setPlaced([]);
    setUsedTileIds(new Set());
    setTileMode(mode);
    setPhase("thinking");
    setHasRetried(false);
    setShowExample(false);
    setHintUsed(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);

  useEffect(() => {
    if (phase !== "thinking" || placed.length === 0) return;
    const tLen = wordCount(entry.word) === 1 ? entry.word.length : wordCount(entry.word);
    if (placed.length === tLen) {
      const correct = checkAnswer(placed, entry, tileMode);
      if (correct) {
        setPhase("correct");
        if (!hintUsed) reviewEntry(entry.id, hasRetried ? 4 : 5, "puzzle");
      } else {
        setPhase("wrong");
      }
    }
  }, [placed, entry, tileMode, phase]);

  function placeTile(tile: Tile) {
    if (phase !== "thinking") return;
    setUsedTileIds((s) => new Set([...s, tile.id]));
    setPlaced((p) => [...p, tile]);
  }

  function removePlaced(tile: Tile) {
    if (phase !== "thinking") return;
    setPlaced((p) => p.filter((t) => t.id !== tile.id));
    setUsedTileIds((s) => {
      const next = new Set(s);
      next.delete(tile.id);
      return next;
    });
  }

  function tryAgain() {
    const { tiles, mode } = buildTiles(entry);
    setPool(tiles);
    setPlaced([]);
    setUsedTileIds(new Set());
    setTileMode(mode);
    setPhase("thinking");
    setHasRetried(true);
  }

  function handleSkip() {
    if (!hintUsed) reviewEntry(entry.id, 0, "puzzle");
    onNext();
  }

  return (
    <div className={["flex flex-col gap-4", phase !== "thinking" ? "pb-28 sm:pb-0" : ""].join(" ").trim()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-3">
        <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">
          {tileMode === "letter" ? t("practice.puzzle.spellWord") : t("practice.puzzle.arrangeWords")}
        </span>
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{entry.explanation}</p>
        {entry.example &&
          (showExample ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic border-l-2 border-emerald-200 dark:border-emerald-700 pl-3">
              {entry.example}
            </p>
          ) : (
            <button
              onClick={() => { setShowExample(true); setHintUsed(true); }}
              className="text-sm text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 text-left transition-colors">
              {t("practice.write.showExample")}
            </button>
          ))}
      </div>

      <div
        className={[
          "min-h-[64px] rounded-xl border-2 p-3 flex flex-wrap gap-2 items-center transition-colors",
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
            className="min-h-[3rem] min-w-[3rem] px-4 py-2 rounded-lg bg-emerald-600 text-white text-base font-medium hover:bg-emerald-700 active:bg-emerald-800 transition-colors touch-manipulation">
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
        {pool.map((tile) => {
          const used = usedTileIds.has(tile.id);
          return (
            <button
              key={tile.id}
              onClick={used || phase !== "thinking" ? undefined : () => placeTile(tile)}
              disabled={used || phase !== "thinking"}
              className={[
                "text-3xl min-h-[3.5rem] min-w-[3.5rem] px-4 py-2.5 rounded-lg border font-medium transition-colors touch-manipulation",
                used
                  ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-default"
                  : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:bg-emerald-100 disabled:opacity-40",
              ].join(" ")}>
              {tile.value}
            </button>
          );
        })}
      </div>

      {phase === "wrong" && (
        <>
          <div className="hidden sm:flex justify-end gap-3">
            <Button variant="secondary" onClick={tryAgain}>
              {t("practice.puzzle.tryAgain")}
            </Button>
            <Button onClick={handleSkip}>{t("practice.puzzle.skip")}</Button>
          </div>
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-10 flex gap-3">
            <Button variant="secondary" onClick={tryAgain} className="flex-1">
              {t("practice.puzzle.tryAgain")}
            </Button>
            <Button onClick={handleSkip} className="flex-1">{t("practice.puzzle.skip")}</Button>
          </div>
        </>
      )}
      {phase === "correct" && (
        <>
          <div className="hidden sm:flex justify-end">
            <Button onClick={onNext}>{t("practice.puzzle.next")}</Button>
          </div>
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-10">
            <Button onClick={onNext} className="w-full h-14 text-base">{t("practice.puzzle.next")}</Button>
          </div>
        </>
      )}
    </div>
  );
}

// ── DuePage ───────────────────────────────────────────────────────────────────

const MODE_OPTIONS: DueMode[] = ["flashcard", "quiz", "puzzle"];

export function DuePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authMode = useAuthStore((s) => s.mode);

  const [showHelp, setShowHelp] = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [dueEntries, setDueEntries] = useState<Entry[]>([]);
  const [selectedModes, setSelectedModes] = useState<DueMode[]>(["flashcard", "quiz", "puzzle"]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [remainingDue, setRemainingDue] = useState(0);

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

  async function startSession() {
    setRemainingDue(0);
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
              {current.mode === "flashcard" && <DueFlashcardItem entry={current.entry} onNext={handleNext} />}
              {current.mode === "quiz" && <DueQuizItem entry={current.entry} pool={dueEntries} onNext={handleNext} />}
              {current.mode === "puzzle" && (
                <DuePuzzleItem entry={current.entry} allEntries={dueEntries} onNext={handleNext} />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Done: results ───────────────────────────────────────── */}
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
            {remainingDue > 0 && (
              <Button variant="secondary" onClick={startSession}>
                {t("practice.quiz.tryAgain")}
              </Button>
            )}
            <Button onClick={() => navigate("/practice")}>{t("practice.backToPractice")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
