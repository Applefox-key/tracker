import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlashCard } from "@/features/flashcards/components/FlashCard";
import { getEntryImageUrl } from "@/api/api";
import type { Entry, SRGrade } from "@/features/entries/types";
import type { Flashcard } from "@/features/flashcards/types";

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

interface FlashcardGameProps {
  entry: Entry;
  onGrade: (grade: SRGrade) => void;
}

export function FlashcardGame({ entry, onGrade }: FlashcardGameProps) {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);

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
      {isFlipped && (
        <div className="hidden sm:block">
          <GradeButtons onGrade={onGrade} />
        </div>
      )}
      {isFlipped && (
        <div
          className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)] px-4 pt-4"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
          <GradeButtons onGrade={onGrade} />
        </div>
      )}
    </div>
  );
}
