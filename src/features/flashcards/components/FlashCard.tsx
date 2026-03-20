import { Flashcard } from "../types";

interface FlashCardProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashCard({ card, isFlipped, onFlip }: FlashCardProps) {
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
          <span className="text-xs font-medium text-indigo-500 uppercase tracking-widest">Word</span>
          <p className="text-3xl font-bold text-gray-900 text-center">{card.front}</p>
          {card.hint && <p className="text-sm text-gray-400 text-center italic">{card.hint}</p>}
          <span className="text-xs text-gray-300 mt-2">tap to reveal</span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-indigo-600 border border-indigo-600 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-4 p-8"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <span className="text-xs font-medium text-indigo-200 uppercase tracking-widest">Explanation</span>
          <p className="text-3xl font-bold text-white text-center">{card.back}</p>
          <span className="text-xs text-indigo-300 mt-2">tap to flip back</span>
        </div>
      </div>
    </div>
  );
}
