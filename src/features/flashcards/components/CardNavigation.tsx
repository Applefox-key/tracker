import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/Button";

interface CardNavigationProps {
  currentIndex: number;
  total: number;
  progress: number;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}

export function CardNavigation({ currentIndex, total, progress, onPrev, onNext, onReset }: CardNavigationProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onPrev}>
          {t("practice.flashcards.prev")}
        </Button>
        <Button variant="secondary" size="sm" onClick={onReset}>
          {t("practice.flashcards.reset")}
        </Button>
        <Button onClick={onNext}>
          {t("practice.flashcards.next")}
        </Button>
      </div>
    </div>
  );
}
