import { useState } from 'react'
import { FlashCard } from '@/features/flashcards/components/FlashCard'
import { CardNavigation } from '@/features/flashcards/components/CardNavigation'
import { useFlashcards } from '@/features/flashcards/hooks/useFlashcards'
import { RatingMultiSelect } from '@/shared/ui/RatingMultiSelect'
import { RatingStars } from '@/shared/ui/RatingStars'
import { Button } from '@/shared/ui/Button'
import { EntryCategory } from '@/features/entries/types'
import { useEntryCrud } from '@/hooks/useEntryCrud'

const CATEGORIES: Array<{ key: EntryCategory; label: string }> = [
  { key: 'word',    label: 'Words' },
  { key: 'phrase',  label: 'Phrases' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'idiom',   label: 'Idioms' },
  { key: 'note',    label: 'Notes' },
]

export function FlashcardsPage() {
  const [selectedRatings, setSelectedRatings]   = useState<number[]>([])
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null)
  const [selectedTag, setSelectedTag]           = useState<string | null>(null)
  const [showFilters, setShowFilters]           = useState(false)

  const { updateEntry } = useEntryCrud()

  const {
    currentCard, currentIndex, total, progress,
    isFlipped, allTags, goNext, goPrev, flip, reset,
  } = useFlashcards({ selectedRatings, selectedCategory, selectedTag })

  const activeFilterCount = [
    selectedRatings.length > 0,
    selectedCategory !== null,
    selectedTag !== null,
  ].filter(Boolean).length

  function clearFilters() {
    setSelectedRatings([])
    setSelectedCategory(null)
    setSelectedTag(null)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Compact header block ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 shrink-0">Flashcards</h1>

        {/* Right side: rating + filters button */}
        <div className="flex items-center gap-3 sm:ml-auto">
          <RatingMultiSelect
            selected={selectedRatings}
            onChange={setSelectedRatings}
            compact
          />

          <div className="w-px h-4 bg-gray-200 shrink-0" />

          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
          >
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">⚙</span>
            {activeFilterCount > 0 && (
              <span className="ml-1">({activeFilterCount})</span>
            )}
            <span className="text-xs ml-1">{showFilters ? '▲' : '▼'}</span>
          </Button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-gray-200" />

      {/* ── Collapsible filters panel ────────────────────────────── */}
      {showFilters && (
        <div className="flex flex-col gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">

          {/* Category */}
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 pt-1.5 shrink-0 w-16">Category:</span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={[
                  'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                  selectedCategory === null
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                ].join(' ')}
              >
                All
              </button>
              {CATEGORIES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                  className={[
                    'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                    selectedCategory === key
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tag */}
          {allTags.length > 0 && (
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500 pt-1 shrink-0 w-16">Tag:</span>
              <div className="flex gap-1.5 flex-wrap">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={[
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                      selectedTag === tag
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-500 border-gray-300 hover:border-indigo-400 hover:text-indigo-600',
                    ].join(' ')}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Card area or empty state ─────────────────────────────── */}
      {!currentCard ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-center">
          <p className="text-gray-400 text-lg">
            {activeFilterCount > 0 ? 'No flashcards match your filters.' : 'No flashcards available.'}
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-indigo-500 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="max-w-xl mx-auto w-full flex flex-col gap-6 pt-2">
          <FlashCard card={currentCard} isFlipped={isFlipped} onFlip={flip} />

          {/* Inline card actions */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Rating:</span>
              <RatingStars
                value={currentCard.rating}
                onChange={(v) => updateEntry(currentCard.id, { rating: v })}
              />
            </div>
            <button
              onClick={() => updateEntry(currentCard.id, { includeInFlashcards: false })}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 active:text-red-700 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-red-50 active:bg-red-100"
              title="Remove from flashcards"
            >
              <span>✕</span>
              <span>Remove</span>
            </button>
          </div>

          <CardNavigation
            currentIndex={currentIndex}
            total={total}
            progress={progress}
            onPrev={goPrev}
            onNext={goNext}
            onReset={reset}
          />
          <p className="text-center text-xs text-gray-300">
            Tap the card to flip · use buttons to navigate
          </p>
        </div>
      )}
    </div>
  )
}
