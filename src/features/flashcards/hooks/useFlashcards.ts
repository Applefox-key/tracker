import { useEffect, useMemo } from 'react'
import { useEntriesStore } from '@/features/entries/store/entriesStore'
import { useFlashcardsStore } from '../store/flashcardsStore'
import { Flashcard } from '../types'
import { EntryCategory, EntryTag } from '@/features/entries/types'

export interface FlashcardFilters {
  selectedRatings: number[]
  selectedCategory: EntryCategory | null
  selectedTag: number | null
}

const EMPTY_FILTERS: FlashcardFilters = {
  selectedRatings: [],
  selectedCategory: null,
  selectedTag: null,
}

export function useFlashcards(filters: FlashcardFilters = EMPTY_FILTERS) {
  const entries = useEntriesStore((s) => s.entries)
  const { currentIndex, isFlipped, goNext, goPrev, flip, reset } = useFlashcardsStore()

  const { selectedRatings, selectedCategory, selectedTag } = filters

  // All tags available on flashcard-eligible entries (unaffected by other filters)
  const allTags = useMemo(() => {
    const seen = new Map<number, EntryTag>()
    entries
      .filter((e) => e.includeInPractice)
      .forEach((e) => e.tags.forEach((t) => seen.set(t.id, t)))
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [entries])

  const cards: Flashcard[] = useMemo(() => {
    return entries
      .filter((e) => {
        if (!e.includeInPractice) return false
        if (selectedRatings.length > 0 && !selectedRatings.includes(e.rating)) return false
        if (selectedCategory !== null && e.category !== selectedCategory) return false
        if (selectedTag !== null && !e.tags.some((t) => t.id === selectedTag)) return false
        return true
      })
      .map((e) => ({
        id: e.id,
        front: e.word,
        back: e.explanation,
        hint: e.example || undefined,
        rating: e.rating,
      }))
  }, [entries, selectedRatings, selectedCategory, selectedTag])

  // Reset to card 0 whenever the filtered deck changes
  const ratingsKey = selectedRatings.join(',')
  useEffect(() => {
    reset()
  }, [ratingsKey, selectedCategory, selectedTag, reset])

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
  }
}
