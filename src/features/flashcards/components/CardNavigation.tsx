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
  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 shrink-0 tabular-nums">
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onPrev}>
          ← Previous
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-gray-400">
          Reset
        </Button>
        <Button onClick={onNext}>Next →</Button>
      </div>
    </div>
  );
}
