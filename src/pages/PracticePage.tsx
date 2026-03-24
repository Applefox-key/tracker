import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEntriesStore } from "@/features/entries/store/entriesStore";
import { wordCount, EMPTY_FILTERS } from "@/features/practice/hooks/usePracticeEntries";
import { Button } from "@/shared/ui/Button";

const MODES = [
  {
    key: "flashcards" as const,
    label: "Flashcards",
    icon: "🃏",
    description: "Flip cards to test your memory",
    route: "/flashcards",
    min: 1,
  },
  {
    key: "quiz" as const,
    label: "Quiz",
    icon: "🧠",
    description: "Choose the correct answer from 4 options",
    route: "/practice/quiz",
    min: 4,
  },
  {
    key: "match" as const,
    label: "Match",
    icon: "🔗",
    description: "Connect words with their explanations",
    route: "/practice/match",
    min: 2,
  },
  {
    key: "puzzle" as const,
    label: "Puzzle",
    icon: "🧩",
    description: "Arrange letters or words in correct order",
    route: "/practice/puzzle",
    min: 1,
  },
];

export function PracticePage() {
  const entries = useEntriesStore((s) => s.entries);
  const navigate = useNavigate();

  const counts = useMemo(() => {
    const base = entries.filter((e) => e.includeInPractice);
    return {
      flashcards: base.length,
      quiz: base.filter((e) => e.category !== "note").length,
      match: base.filter((e) => e.category !== "note").length,
      puzzle: base.filter((e) => !["note", "grammar"].includes(e.category)).filter((e) => wordCount(e.word) <= 10)
        .length,
    };
  }, [entries]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Practice</h1>
        <p className="text-gray-500 mt-1 text-sm">Choose a study mode</p>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODES.map((mode) => {
          const count = counts[mode.key];
          const disabled = count < mode.min;
          return (
            <div
              key={mode.key}
              className={[
                "bg-white rounded-2xl border p-2 sm:p-6 flex flex-col gap-4 transition-shadow",
                disabled ? "border-gray-100 opacity-60" : "border-gray-200 shadow-sm hover:shadow-md",
              ].join(" ")}>
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none">{mode.icon}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900">{mode.label}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{mode.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-sm text-gray-400">
                  {count} {count === 1 ? "entry" : "entries"} available
                </span>
                {disabled ? (
                  <span className="text-xs text-gray-400 italic">Need at least {mode.min}</span>
                ) : (
                  <Button size="sm" onClick={() => navigate(mode.route)}>
                    Start →
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// keep EMPTY_FILTERS imported to avoid unused warning
void EMPTY_FILTERS;
