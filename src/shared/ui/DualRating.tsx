import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const masteryStarColors: Record<number, string> = {
  1: 'text-red-400',
  2: 'text-orange-400',
  3: 'text-yellow-400',
  4: 'text-blue-400',
  5: 'text-emerald-400',
};

interface DualRatingProps {
  confidenceRating: number;
  masteryLevel?: number | null;
  onConfidenceChange?: (value: number) => void;
}

export function DualRating({ confidenceRating, masteryLevel, onConfidenceChange }: DualRatingProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(0);
  const readOnly = !onConfidenceChange;

  const delta = masteryLevel != null && confidenceRating > 0 ? masteryLevel - confidenceRating : null;
  const filledStarColor = masteryLevel != null ? masteryStarColors[masteryLevel] : 'text-gray-200 dark:text-gray-700';

  return (
    <div className="flex flex-col gap-1">
      {/* User confidence row */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 dark:text-gray-500 w-14 shrink-0">
          {t('entries.rating.you')}
        </span>
        <span className="flex gap-0.5" aria-label={`Confidence: ${confidenceRating} out of 5`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => onConfidenceChange?.(star)}
              onMouseEnter={() => !readOnly && setHovered(star)}
              onMouseLeave={() => !readOnly && setHovered(0)}
              className={[
                'text-lg leading-none focus:outline-none transition-transform',
                !readOnly ? 'cursor-pointer hover:scale-125' : 'cursor-default',
              ].join(' ')}
              aria-label={`Rate ${star}`}
            >
              <span className={(hovered || confidenceRating) >= star ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}>
                ★
              </span>
            </button>
          ))}
        </span>
      </div>

      {/* System mastery row */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 dark:text-gray-500 w-14 shrink-0">
          {t('entries.rating.system')}
        </span>
        <span className="flex gap-0.5" aria-label={`System rating: ${masteryLevel ?? 0} out of 5`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={[
                'text-lg leading-none',
                masteryLevel != null && star <= masteryLevel ? filledStarColor : 'text-gray-200 dark:text-gray-700',
              ].join(' ')}
            >
              ★
            </span>
          ))}
        </span>
        {delta !== null && delta !== 0 && (
          <span className={[
            'text-xs font-medium tabular-nums',
            delta > 0 ? 'text-emerald-500' : 'text-orange-400',
          ].join(' ')}>
            {delta > 0 ? `+${delta}` : `${delta}`}
          </span>
        )}
      </div>
    </div>
  );
}
