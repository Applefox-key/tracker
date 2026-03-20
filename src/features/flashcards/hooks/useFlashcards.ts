import { useEffect, useMemo } from 'react'
import { useEntriesStore } from '@/features/entries/store/entriesStore'
import { useFlashcardsStore } from '../store/flashcardsStore'
import { Flashcard } from '../types'
import { EntryCategory } from '@/features/entries/types'

export interface FlashcardFilters {
  selectedRatings: number[]
  selectedCategory: EntryCategory | null
  selectedTag: string | null
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
    const tagSet = new Set<string>()
    entries
      .filter((e) => e.includeInFlashcards)
      .forEach((e) => e.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [entries])

  const cards: Flashcard[] = useMemo(() => {
    return entries
      .filter((e) => {
        if (!e.includeInFlashcards) return false
        if (selectedRatings.length > 0 && !selectedRatings.includes(e.rating)) return false
        if (selectedCategory !== null && e.category !== selectedCategory) return false
        if (selectedTag !== null && !e.tags.includes(selectedTag)) return false
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
