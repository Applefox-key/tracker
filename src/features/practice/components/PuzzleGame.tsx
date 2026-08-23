import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { shuffle, wordCount } from "@/features/practice/hooks/usePracticeEntries";
import { Button } from "@/shared/ui/Button";
import { EntryImage } from "@/shared/ui/EntryImage";
import { getEntryImageUrl } from "@/api/api";
import type { Entry } from "@/features/entries/types";

interface Tile {
  id: string;
  value: string;
}

type AnswerPhase = "thinking" | "correct" | "wrong";

function randomLetter(): string {
  return String.fromCharCode(97 + Math.floor(Math.random() * 26));
}

export function buildTiles(entry: Entry, allEntries: Entry[] = []): { tiles: Tile[]; mode: "letter" | "word" } {
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

export function checkAnswer(placed: Tile[], entry: Entry, mode: "letter" | "word"): boolean {
  if (mode === "letter") return placed.map((t) => t.value).join("") === entry.word.toLowerCase();
  return (
    placed
      .map((t) => t.value)
      .join(" ")
      .toLowerCase() === entry.word.toLowerCase()
  );
}

interface PuzzleGameProps {
  entry: Entry;
  allEntries: Entry[];
  showImages?: boolean;
  nextLabel: string;
  skipLabel: string;
  onCorrect: (hintUsed: boolean, retried: boolean) => void;
  onSkip: (hintUsed: boolean) => void;
}

export function PuzzleGame({
  entry,
  allEntries,
  showImages,
  nextLabel,
  skipLabel,
  onCorrect,
  onSkip,
}: PuzzleGameProps) {
  const { t } = useTranslation();
  const [pool, setPool] = useState<Tile[]>([]);
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [usedTileIds, setUsedTileIds] = useState<Set<string>>(new Set());
  const [tileMode, setTileMode] = useState<"letter" | "word">("letter");
  const [phase, setPhase] = useState<AnswerPhase>("thinking");
  const [hasRetried, setHasRetried] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showTilesHint, setShowTilesHint] = useState(false);

  const tLen = wordCount(entry.word) === 1 ? entry.word.length : wordCount(entry.word);

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
    setShowTilesHint(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);

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

  function handleCheck(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (phase !== "thinking" || placed.length === 0) return;
    if (checkAnswer(placed, entry, tileMode)) {
      setPhase("correct");
    } else {
      setHasRetried(true);
      setPhase("wrong");
    }
  }

  function tryAgain() {
    const { tiles, mode } = buildTiles(entry, allEntries);
    setPool(tiles);
    setPlaced([]);
    setUsedTileIds(new Set());
    setTileMode(mode);
    setPhase("thinking");
    setHasRetried(true);
  }

  return (
    <div
      className={["flex flex-col gap-4", phase !== "thinking" || placed.length >= 1 ? "pb-28 sm:pb-0" : ""]
        .join(" ")
        .trim()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-3">
        <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">
          {tileMode === "letter" ? t("practice.puzzle.spellWord") : t("practice.puzzle.arrangeWords")}
        </span>
        <div className="flex items-start gap-4">
          <p className="flex-1 text-base font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
            {entry.explanation}
          </p>
          {showImages && entry.img && (
            <EntryImage
              src={getEntryImageUrl(entry.img)}
              alt=""
              className="rounded-lg border border-gray-200 dark:border-gray-600 shrink-0"
              style={{ maxWidth: 100, maxHeight: 80, objectFit: "contain" }}
            />
          )}
        </div>
        {entry.example &&
          (showExample ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic border-l-2 border-emerald-200 dark:border-emerald-700 pl-3">
              {entry.example}
            </p>
          ) : (
            <button
              onClick={() => {
                setShowExample(true);
                setHintUsed(true);
              }}
              className="text-sm text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 text-left transition-colors">
              {t("practice.puzzle.showExample")}
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

        {phase === "thinking" && placed.length !== 0 && (
          <button
            className="hidden sm:block ml-auto text-teal-600 dark:text-teal-400 disabled:text-teal-100 dark:disabled:text-teal-100 font-semibold text-sm"
            onClick={handleCheck}
            disabled={placed.length === 0}>
            {t("practice.puzzle.checkAnswer")}
          </button>
        )}
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
      {phase === "thinking" && (
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
          {usedTileIds.size === pool.length && phase === "thinking" && (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
              {t("practice.puzzle.allTilesPlaced")}
            </span>
          )}
        </div>
      )}
      {/* HINT */}
      {phase === "thinking" ? (
        <button
          onClick={() => setShowTilesHint((v) => !v)}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          {showTilesHint
            ? t("practice.puzzle.tilesPlaced", {
                placed: placed.length,
                total: tLen,
              })
            : t("practice.puzzle.hint")}
        </button>
      ) : (
        <div>
          {phase === "wrong" && (
            <>
              <div className="hidden sm:flex justify-end gap-3">
                <Button variant="secondary" onClick={tryAgain}>
                  {t("practice.puzzle.tryAgain")}
                </Button>
                <Button onClick={() => onSkip(hintUsed)}>{skipLabel}</Button>
              </div>
              <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-10 flex gap-3">
                <Button variant="secondary" onClick={tryAgain} className="flex-1">
                  {t("practice.puzzle.tryAgain")}
                </Button>
                <Button onClick={() => onSkip(hintUsed)} className="flex-1">
                  {skipLabel}
                </Button>
              </div>
            </>
          )}
          {phase === "correct" && (
            <>
              <div className="hidden sm:flex justify-end">
                <Button onClick={() => onCorrect(hintUsed, hasRetried)}>{nextLabel}</Button>
              </div>
              <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-10">
                <Button onClick={() => onCorrect(hintUsed, hasRetried)} className="w-full h-14 text-base">
                  {nextLabel}
                </Button>
              </div>
            </>
          )}
        </div>
      )}{" "}
      {phase === "thinking" && placed.length >= 1 && (
        <>
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-10">
            <Button onClick={handleCheck} className="w-full h-14 text-base">
              {t("practice.puzzle.checkAnswer")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
