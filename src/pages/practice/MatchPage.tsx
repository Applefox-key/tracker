import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  usePracticeEntries,
  usePracticeTags,
  shuffle,
} from '@/features/practice/hooks/usePracticeEntries'
import { PracticeFilterPanel } from '@/features/practice/components/PracticeFilterPanel'
import { Button } from '@/shared/ui/Button'
import type { Entry, EntryCategory } from '@/features/entries/types'

interface MatchCard {
  id: string
  entryId: number
  type: 'word' | 'explanation'
  text: string
}

const ROUND_SIZE = 6

function buildColumns(entries: Entry[]): { words: MatchCard[]; explanations: MatchCard[] } {
  return {
    words: shuffle(entries.map((e) => ({ id: `w-${e.id}`, entryId: e.id, type: 'word' as const, text: e.word }))),
    explanations: shuffle(entries.map((e) => ({ id: `e-${e.id}`, entryId: e.id, type: 'explanation' as const, text: e.explanation }))),
  }
}

export function MatchPage() {
  const navigate = useNavigate()
  const allTags = usePracticeTags()

  const [selectedRatings, setSelectedRatings] = useState<number[]>([])
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null)
  const [selectedTag, setSelectedTag] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [allEntries, setAllEntries] = useState<Entry[]>([])
  const [roundStart, setRoundStart] = useState(0)
  const [wordCards, setWordCards] = useState<MatchCard[]>([])
  const [explanationCards, setExplanationCards] = useState<MatchCard[]>([])
  const [selectedWord, setSelectedWord] = useState<MatchCard | null>(null)
  const [selectedExplanation, setSelectedExplanation] = useState<MatchCard | null>(null)
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set())
  const [totalMatched, setTotalMatched] = useState(0)
  const [isDone, setIsDone] = useState(false)

  const filteredEntries = usePracticeEntries('match', { selectedRatings, selectedCategory, selectedTag })

  const activeFilterCount = [
    selectedRatings.length > 0,
    selectedCategory !== null,
    selectedTag !== null,
  ].filter(Boolean).length

  const roundEntries = allEntries.slice(roundStart, roundStart + ROUND_SIZE)
  const roundSize = roundEntries.length
  const roundComplete = matched.size === roundSize && roundSize > 0
  const totalPairs = allEntries.length

  useEffect(() => {
    if (!isPlaying || roundEntries.length === 0) return
    const { words, explanations } = buildColumns(roundEntries)
    setWordCards(words)
    setExplanationCards(explanations)
    setSelectedWord(null)
    setSelectedExplanation(null)
    setWrongIds(new Set())
    setMatched(new Set())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, roundStart, allEntries])

  useEffect(() => {
    if (!selectedWord || !selectedExplanation) return
    if (selectedWord.entryId === selectedExplanation.entryId) {
      const id = selectedWord.entryId
      setMatched((prev) => new Set([...prev, id]))
      setSelectedWord(null)
      setSelectedExplanation(null)
    } else {
      setWrongIds(new Set([selectedWord.id, selectedExplanation.id]))
      setTimeout(() => {
        setWrongIds(new Set())
        setSelectedWord(null)
        setSelectedExplanation(null)
      }, 600)
    }
  }, [selectedWord, selectedExplanation])

  function clearFilters() {
    setSelectedRatings([])
    setSelectedCategory(null)
    setSelectedTag(null)
  }

  function startSession() {
    const shuffled = shuffle(filteredEntries)
    setAllEntries(shuffled)
    setRoundStart(0)
    setTotalMatched(0)
    setIsDone(false)
    setIsPlaying(true)
  }

  function handleWordClick(card: MatchCard) {
    if (matched.has(card.entryId) || wrongIds.size > 0) return
    setSelectedWord((prev) => (prev?.id === card.id ? null : card))
  }

  function handleExplanationClick(card: MatchCard) {
    if (matched.has(card.entryId) || wrongIds.size > 0) return
    setSelectedExplanation((prev) => (prev?.id === card.id ? null : card))
  }

  function advanceRound() {
    const nextTotalMatched = totalMatched + roundSize
    setTotalMatched(nextTotalMatched)
    const nextRoundStart = roundStart + ROUND_SIZE
    if (nextRoundStart >= allEntries.length) setIsDone(true)
    else setRoundStart(nextRoundStart)
  }

  function cardCls(card: MatchCard, selectedId: string | undefined): string {
    const isMatched = matched.has(card.entryId)
    const isSelected = selectedId === card.id
    const isWrong = wrongIds.has(card.id)
    const base = 'w-full rounded-xl border px-3 py-2.5 text-left transition-all duration-150 select-none '
    if (isMatched) return base + 'bg-green-50 border-green-300 text-green-700 cursor-default opacity-60'
    if (isWrong) return base + 'bg-red-50 border-red-400 text-red-700 cursor-default'
    if (isSelected) return base + 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-sm cursor-pointer'
    return base + 'bg-white border-gray-200 text-gray-800 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer'
  }

  if (!isPlaying) {
    const canStart = filteredEntries.length >= 2
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/practice')} className="text-gray-400 hover:text-gray-600 transition-colors">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">Match</h1>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant={showFilters ? 'primary' : 'secondary'} size="sm" onClick={() => setShowFilters((v) => !v)}>
              <span className="hidden sm:inline">Filters</span>
              <span className="sm:hidden">⚙</span>
              {activeFilterCount > 0 && <span className="ml-1">({activeFilterCount})</span>}
              <span className="text-xs ml-1">{showFilters ? '▲' : '▼'}</span>
            </Button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
            )}
          </div>
        </div>

        {showFilters && (
          <PracticeFilterPanel
            allTags={allTags}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
            selectedRatings={selectedRatings}
            onRatingsChange={setSelectedRatings}
          />
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
          <span className="text-5xl">🔗</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Match Mode</h2>
            <p className="text-gray-500 mt-1 text-sm">Connect words with their explanations</p>
          </div>
          <p className="text-sm text-gray-400">{filteredEntries.length} entries available</p>
          {!canStart && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              Need at least 2 entries to start
            </p>
          )}
          <Button onClick={startSession} disabled={!canStart} size="lg">Start Match →</Button>
        </div>
      </div>
    )
  }

  if (isDone) {
    const finalTotal = totalMatched + roundSize
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/practice')} className="text-gray-400 hover:text-gray-600 transition-colors">← Practice</button>
          <h1 className="text-2xl font-bold text-gray-900">Match — Done!</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto w-full">
          <span className="text-5xl">🎉</span>
          <div>
            <p className="text-3xl font-bold text-gray-900">{finalTotal} / {totalPairs}</p>
            <p className="text-gray-500 mt-1">pairs matched</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button variant="secondary" onClick={startSession}>Play again</Button>
            <Button onClick={() => navigate('/practice')}>Back to Practice</Button>
          </div>
        </div>
      </div>
    )
  }

  const overallProgress = totalPairs > 0 ? Math.round(((totalMatched + matched.size) / totalPairs) * 100) : 0

  return (
    <>
      <style>{`
        @keyframes match-shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-7px); }
          40%     { transform: translateX(7px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
        .match-shake { animation: match-shake 0.5s ease; }
      `}</style>

      <div className="flex flex-col gap-5 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsPlaying(false)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors shrink-0">✕ Quit</button>
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${overallProgress}%` }} />
          </div>
          <span className="text-sm text-gray-500 shrink-0 tabular-nums">{totalMatched + matched.size} / {totalPairs}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Words</p>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Explanations</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            {wordCards.map((card) => {
              const isWrong = wrongIds.has(card.id)
              return (
                <button key={card.id} onClick={() => handleWordClick(card)} disabled={matched.has(card.entryId) || wrongIds.size > 0} className={[cardCls(card, selectedWord?.id), isWrong ? 'match-shake' : ''].join(' ')}>
                  <span className="text-sm font-semibold leading-snug block">{card.text}</span>
                  {matched.has(card.entryId) && <span className="text-green-500 text-xs ml-1">✓</span>}
                </button>
              )
            })}
          </div>
          <div className="flex flex-col gap-2">
            {explanationCards.map((card) => {
              const isSelected = selectedExplanation?.id === card.id
              const isWrong = wrongIds.has(card.id)
              return (
                <button key={card.id} onClick={() => handleExplanationClick(card)} disabled={matched.has(card.entryId) || wrongIds.size > 0} className={[cardCls(card, selectedExplanation?.id), isWrong ? 'match-shake' : ''].join(' ')}>
                  <span className="text-xs leading-snug block" style={!isSelected ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : undefined}>
                    {card.text}
                  </span>
                  {matched.has(card.entryId) && <span className="text-green-500 text-xs ml-1">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {!roundComplete && <p className="text-xs text-gray-400 text-center">Select a word, then its explanation to match</p>}

        {roundComplete && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-green-600 font-semibold">
              {roundStart + ROUND_SIZE >= allEntries.length ? 'All pairs matched! 🎉' : 'Round complete! 🎉'}
            </p>
            <Button onClick={advanceRound}>
              {roundStart + ROUND_SIZE >= allEntries.length ? 'See results' : 'Next round →'}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
