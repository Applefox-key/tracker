import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { shuffle } from "@/features/practice/hooks/usePracticeEntries";
import { Button } from "@/shared/ui/Button";
import type { Entry } from "@/features/entries/types";

interface QuizGameProps {
  entry: Entry;
  pool: Entry[];
  nextLabel: string;
  onSelect: (isCorrect: boolean, hintUsed: boolean) => void;
  onNext: () => void;
}

export function QuizGame({ entry, pool, nextLabel, onSelect, onNext }: QuizGameProps) {
  const { t } = useTranslation();
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
    onSelect(isCorrect, hintUsed);
  }

  function handleShowExample() {
    setShowExample(true);
    setHintUsed(true);
  }

  const answered = selected !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-teal-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-3">
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
          <Button onClick={onNext}>{nextLabel}</Button>
        </div>
      )}
    </div>
  );
}
