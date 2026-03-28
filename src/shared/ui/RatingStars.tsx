import { useState } from 'react'

interface RatingStarsProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
}

export function RatingStars({ value, onChange, readOnly = false }: RatingStarsProps) {
  const [hovered, setHovered] = useState(0)

  return (
    <span className="flex gap-0.5" aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={[
            'text-lg leading-none focus:outline-none transition-transform',
            !readOnly && onChange ? 'cursor-pointer hover:scale-125' : 'cursor-default',
          ].join(' ')}
          aria-label={`Rate ${star}`}
        >
          <span className={(hovered || value) >= star ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}>
            ★
          </span>
        </button>
      ))}
    </span>
  )
}
