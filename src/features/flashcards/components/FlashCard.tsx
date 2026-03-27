import { Flashcard } from "../types";

interface FlashCardProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  reversed?: boolean;
}

export function FlashCard({ card, isFlipped, onFlip, reversed = false }: FlashCardProps) {
  const frontLabel = reversed ? "Explanation" : "Word";
  const frontText = reversed ? card.back : card.front;
  const backLabel = reversed ? "Word" : "Explanation";
  const backText = reversed ? card.front : card.back;
  const showHint = !reversed && !!card.hint;

  return (
    <div className="cursor-pointer select-none" style={{ perspective: "1200px" }} onClick={onFlip}>
      <div
        className="relative w-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "260px",
        }}>
        {/* Front */}
        <div
          className="absolute inset-0 bg-white border border-gray-200 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-4 p-8"
          style={{ backfaceVisibility: "hidden" }}>
          <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">{frontLabel}</span>
          <p className="text-3xl font-bold text-gray-900 text-center">{frontText}</p>
          {showHint && <p className="text-sm text-gray-400 text-center italic">{card.hint}</p>}
          <span className="text-xs text-gray-300 mt-2">tap to reveal</span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-emerald-600 border border-emerald-600 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-4 p-8"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <span className="text-xs font-medium text-emerald-200 uppercase tracking-widest">{backLabel}</span>
          <p className="text-3xl font-bold text-white text-center">{backText}</p>
          <span className="text-xs text-emerald-300 mt-2">tap to flip back</span>
        </div>
      </div>
    </div>
  );
}
