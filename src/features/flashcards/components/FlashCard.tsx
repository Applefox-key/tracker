import { Flashcard } from "../types";
import { SpeakButton } from "@/shared/ui/SpeakButton";
import { EntryImage } from "@/shared/ui/EntryImage";

interface FlashCardProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  reversed?: boolean;
  flipAnimated?: boolean;
}

export function FlashCard({ card, isFlipped, onFlip, reversed = false, flipAnimated = true }: FlashCardProps) {
  const frontLabel = reversed ? "Explanation" : "Word";
  const frontText = reversed ? card.back : card.front;
  const backLabel = reversed ? "Word" : "Explanation";
  const backText = reversed ? card.front : card.back;

  return (
    <div className="cursor-pointer select-none" style={{ perspective: "1200px" }} onClick={onFlip}>
      <div
        className="relative w-full"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: flipAnimated ? "transform 500ms" : "none",
          minHeight: "260px",
        }}>
        {/* ── Front ─────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg flex flex-col"
          style={{ backfaceVisibility: "hidden" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
            <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">{frontLabel}</span>
            <SpeakButton text={frontText} />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto flex items-center justify-center px-8 py-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">{frontText}</p>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-5 pb-4 pt-2 flex justify-center">
            <span className="text-xs text-gray-300 dark:text-gray-600">tap to reveal</span>
          </div>
        </div>

        {/* ── Back ──────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 bg-emerald-600 border border-emerald-600 rounded-2xl shadow-lg flex flex-col"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
            <span className="text-xs font-medium text-emerald-200 uppercase tracking-widest">{backLabel}</span>
            <SpeakButton
              text={backText}
              className="[&_button]:text-emerald-400 [&_button]:hover:text-white [&_button]:hover:bg-emerald-500"
            />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="flex flex-col items-center gap-3 min-h-full justify-center">
              <p className="text-2xl font-bold text-white text-center whitespace-pre-wrap break-words">{backText}</p>
              {card.hint && (
                <p className="text-sm text-emerald-100 text-center italic opacity-90 whitespace-pre-wrap break-words">
                  "{card.hint}"
                </p>
              )}
              {card.img && (
                <EntryImage
                  src={card.img}
                  alt={backText}
                  className="rounded-lg border border-emerald-500/40"
                  style={{ maxWidth: "100%", maxHeight: 100, objectFit: "contain" }}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-5 pb-4 pt-2 flex justify-center">
            <span className="text-xs text-emerald-300">tap to flip back</span>
          </div>
        </div>
      </div>
    </div>
  );
}
