import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntriesStore } from '@/features/entries/store/entriesStore'
import { usePracticeTags, wordCount, EMPTY_FILTERS } from '@/features/practice/hooks/usePracticeEntries'
import { PracticeFilterPanel } from '@/features/practice/components/PracticeFilterPanel'
import { RatingMultiSelect } from '@/shared/ui/RatingMultiSelect'
import { Button } from '@/shared/ui/Button'
import type { EntryCategory } from '@/features/entries/types'

const MODES = [
  {
    key: 'flashcards' as const,
    label: 'Flashcards',
    icon: '🃏',
    description: 'Flip cards to test your memory',
    route: '/flashcards',
    min: 1,
  },
  {
    key: 'quiz' as const,
    label: 'Quiz',
    icon: '🧠',
    description: 'Choose the correct answer from 4 options',
    route: '/practice/quiz',
    min: 4,
  },
  {
    key: 'match' as const,
    label: 'Match',
    icon: '🔗',
    description: 'Connect words with their explanations',
    route: '/practice/match',
    min: 2,
  },
  {
    key: 'puzzle' as const,
    label: 'Puzzle',
    icon: '🧩',
    description: 'Arrange letters or words in correct order',
    route: '/practice/puzzle',
    min: 1,
  },
]

export function PracticePage() {
  const entries = useEntriesStore((s) => s.entries)
  const navigate = useNavigate()
  const allTags = usePracticeTags()

  const [selectedRatings, setSelectedRatings] = useState<number[]>([])
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const ratingsKey = selectedRatings.join(',')
  const activeFilterCount = [
    selectedRatings.length > 0,
    selectedCategory !== null,
    selectedTag !== null,
  ].filter(Boolean).length

  const counts = useMemo(() => {
    const base = entries.filter((e) => {
      if (!e.includeInPractice) return false
      if (selectedRatings.length && !selectedRatings.includes(e.rating)) return false
      if (selectedCategory !== null && e.category !== selectedCategory) return false
      if (selectedTag !== null && !e.tags.includes(selectedTag)) return false
      return true
    })
    return {
      flashcards: base.length,
      quiz:  base.filter((e) => e.category !== 'note').length,
      match: base.filter((e) => e.category !== 'note').length,
      puzzle: base
        .filter((e) => !['note', 'grammar'].includes(e.category))
        .filter((e) => wordCount(e.word) <= 10).length,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, ratingsKey, selectedCategory, selectedTag])

  function clearFilters() {
    setSelectedRatings([])
    setSelectedCategory(null)
    setSelectedTag(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice</h1>
          <p className="text-gray-500 mt-1 text-sm">Choose a study mode</p>
        </div>
        <div className="flex items-center gap-3 sm:ml-auto">
          <RatingMultiSelect selected={selectedRatings} onChange={setSelectedRatings} compact />
          <div className="w-px h-4 bg-gray-200 shrink-0" />
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
          >
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">⚙</span>
            {activeFilterCount > 0 && <span className="ml-1">({activeFilterCount})</span>}
            <span className="text-xs ml-1">{showFilters ? '▲' : '▼'}</span>
          </Button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0">
              Clear
            </button>
          )}
        </div>
      </div>

      <hr className="border-gray-200" />

      {showFilters && (
        <PracticeFilterPanel
          allTags={allTags}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
        />
      )}

      {/* Mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODES.map((mode) => {
          const count = counts[mode.key]
          const disabled = count < mode.min
          return (
            <div
              key={mode.key}
              className={[
                'bg-white rounded-2xl border p-6 flex flex-col gap-4 transition-shadow',
                disabled
                  ? 'border-gray-100 opacity-60'
                  : 'border-gray-200 shadow-sm hover:shadow-md',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none">{mode.icon}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900">{mode.label}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{mode.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-sm text-gray-400">
                  {count} {count === 1 ? 'entry' : 'entries'} available
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
          )
        })}
      </div>
    </div>
  )
}

// keep EMPTY_FILTERS imported to avoid unused warning
void EMPTY_FILTERS
