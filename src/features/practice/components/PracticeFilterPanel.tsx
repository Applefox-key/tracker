import { RatingMultiSelect } from '@/shared/ui/RatingMultiSelect'
import type { EntryCategory, EntryTag } from '@/features/entries/types'

const CATEGORIES: Array<{ key: EntryCategory; label: string }> = [
  { key: 'word',    label: 'Words' },
  { key: 'phrase',  label: 'Phrases' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'idiom',   label: 'Idioms' },
  { key: 'note',    label: 'Notes' },
]

const btnBase = 'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors'
const active  = 'bg-indigo-600 text-white border-indigo-600'
const inactive = 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'

interface Props {
  allTags: EntryTag[]
  selectedCategory: EntryCategory | null
  onCategoryChange: (c: EntryCategory | null) => void
  selectedTag: number | null
  onTagChange: (t: number | null) => void
  selectedRatings: number[]
  onRatingsChange: (r: number[]) => void
}

export function PracticeFilterPanel({
  allTags,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  selectedRatings,
  onRatingsChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
      <div className="flex items-start gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500 pt-1.5 shrink-0 w-16">Category:</span>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => onCategoryChange(null)}
            className={[btnBase, selectedCategory === null ? active : inactive].join(' ')}
          >
            All
          </button>
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onCategoryChange(selectedCategory === key ? null : key)}
              className={[btnBase, selectedCategory === key ? active : inactive].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 pt-1 shrink-0 w-16">Tag:</span>
          <div className="flex gap-1.5 flex-wrap">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onTagChange(selectedTag === tag.id ? null : tag.id)}
                className={[
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  selectedTag === tag.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-indigo-400 hover:text-indigo-600',
                ].join(' ')}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500 pt-1.5 shrink-0 w-16">Rating:</span>
        <RatingMultiSelect
          selected={selectedRatings}
          onChange={onRatingsChange}
        />
      </div>
    </div>
  )
}
