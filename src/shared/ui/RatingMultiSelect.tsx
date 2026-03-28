import { useState } from 'react'

interface RatingMultiSelectProps {
  selected: number[]
  onChange: (selected: number[]) => void
  /** Compact mode: bare stars, no box or number labels */
  compact?: boolean
}

export function RatingMultiSelect({ selected, onChange, compact = false }: RatingMultiSelectProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  function toggle(star: number) {
    onChange(
      selected.includes(star)
        ? selected.filter((s) => s !== star)
        : [...selected, star]
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isSelected = selected.includes(star)
          const isHovered  = hovered === star
          return (
            <button
              key={star}
              type="button"
              onClick={() => toggle(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              aria-pressed={isSelected}
              aria-label={`Toggle rating ${star}`}
              className="text-base leading-none cursor-pointer focus:outline-none transition-transform hover:scale-125 px-0.5"
            >
              <span
                className={
                  isSelected
                    ? isHovered ? 'text-amber-600' : 'text-amber-400'
                    : isHovered ? 'text-amber-300' : 'text-gray-300 dark:text-gray-600'
                }
              >
                ★
              </span>
            </button>
          )
        })}
        {selected.length > 0 && (
          <span className="ml-1.5 text-xs text-amber-500 font-medium">
            {[...selected].sort((a, b) => a - b).join(',')}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {[1, 2, 3, 4, 5].map((star) => {
        const isSelected = selected.includes(star)
        const isHovered  = hovered === star
        return (
          <button
            key={star}
            type="button"
            onClick={() => toggle(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            aria-pressed={isSelected}
            aria-label={`Toggle rating ${star}`}
            className={[
              'flex items-center px-2.5 py-1.5 rounded-lg border',
              'cursor-pointer transition-all duration-150 focus:outline-none',
              'focus-visible:ring-2 focus-visible:ring-amber-400',
              isSelected
                ? isHovered
                  ? 'bg-amber-100 border-amber-500 text-amber-600 dark:bg-amber-900/40 dark:border-amber-500'
                  : 'bg-amber-50 border-amber-400 text-amber-500 dark:bg-amber-900/30 dark:border-amber-600'
                : isHovered
                  ? 'bg-gray-50 border-amber-300 text-amber-400 dark:bg-gray-700 dark:border-amber-600'
                  : 'bg-white border-gray-200 text-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500',
            ].join(' ')}
          >
            <span className="text-sm leading-none tracking-tight">
              {'★'.repeat(star)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
