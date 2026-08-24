import { useEffect, useMemo, useState } from 'react'
import { useEntriesStore } from '@/features/entries/store/entriesStore'
import { useFlashcardsStore } from '../store/flashcardsStore'
import { Flashcard } from '../types'
import { EntryTag } from '@/features/entries/types'
import { getEntryImageUrl } from '@/api/api'
import type { PracticeFilters } from '@/features/practice/hooks/usePracticeEntries'
import { EMPTY_FILTERS } from '@/features/practice/hooks/usePracticeEntries'

function isStale(lastReviewedAt: string | null | undefined): boolean {
  if (!lastReviewedAt) return true
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  return new Date(lastReviewedAt) < cutoff
}

export function useFlashcards(filters: PracticeFilters = EMPTY_FILTERS) {
  const entries = useEntriesStore((s) => s.entries)
  const { currentIndex, isFlipped, goNext, goPrev, flip, reset } = useFlashcardsStore()

  const { selectedRatings, selectedCategory, selectedTag, masteryFilter, staleOnly } = filters

  const [shuffledIds, setShuffledIds] = useState<number[] | null>(null)

  // All tags available on flashcard-eligible entries (unaffected by other filters)
  const allTags = useMemo(() => {
    const seen = new Map<number, EntryTag>()
    entries
      .filter((e) => e.includeInPractice)
      .forEach((e) => e.tags.forEach((t) => seen.set(t.id, t)))
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [entries])

  const filteredCards: Flashcard[] = useMemo(() => {
    return entries
      .filter((e) => {
        if (!e.includeInPractice) return false
        if (selectedRatings.length > 0 && !selectedRatings.includes(e.rating)) return false
        if (selectedCategory !== null && e.category !== selectedCategory) return false
        if (selectedTag !== null && !e.tags.some((t) => t.id === selectedTag)) return false
        if (masteryFilter === 'unmastered' && e.rating >= 5) return false
        if (masteryFilter === 'mastered' && e.rating < 5) return false
        if (staleOnly && !isStale(e.last_reviewed_at)) return false
        return true
      })
      .map((e) => ({
        id: e.id,
        front: e.word,
        back: e.explanation,
        hint: e.example || undefined,
        rating: e.rating,
        img: e.img ? getEntryImageUrl(e.img) : null,
        category: e.category,
      }))
  }, [entries, selectedRatings, selectedCategory, selectedTag, masteryFilter, staleOnly])

  // Apply stored shuffle order to current filtered cards (handles entries being updated mid-session)
  const cards: Flashcard[] = useMemo(() => {
    if (!shuffledIds) return filteredCards
    const cardMap = new Map(filteredCards.map((c) => [c.id, c]))
    const ordered = shuffledIds.flatMap((id) => {
      const card = cardMap.get(id)
      return card ? [card] : []
    })
    const orderedSet = new Set(shuffledIds)
    const newCards = filteredCards.filter((c) => !orderedSet.has(c.id))
    return [...ordered, ...newCards]
  }, [filteredCards, shuffledIds])

  // Reset to card 0 and clear shuffle when filters change
  const ratingsKey = selectedRatings.join(',')
  useEffect(() => {
    setShuffledIds(null)
    reset()
  }, [ratingsKey, selectedCategory, selectedTag, masteryFilter, staleOnly, reset])

  function shuffleOnce() {
    const arr = [...filteredCards]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    setShuffledIds(arr.map((c) => c.id))
    reset()
  }

  const total = cards.length
  const safeIndex = total > 0 ? Math.min(currentIndex, total - 1) : 0
  const currentCard = cards[safeIndex] ?? null
  const progress = total > 0 ? Math.round(((safeIndex + 1) / total) * 100) : 0

  return {
    currentCard,
    currentIndex: safeIndex,
    total,
    progress,
    isFlipped,
    allTags,
    goNext: () => goNext(total),
    goPrev: () => goPrev(total),
    flip,
    reset,
    shuffleOnce,
  }
}
