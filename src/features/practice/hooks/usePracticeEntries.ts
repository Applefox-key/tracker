import { useMemo } from 'react'
import { useEntriesStore } from '@/features/entries/store/entriesStore'
import type { Entry, EntryCategory, EntryTag } from '@/features/entries/types'

export interface PracticeFilters {
  selectedRatings: number[]
  selectedCategory: EntryCategory | null
  selectedTag: number | null
}

export const EMPTY_FILTERS: PracticeFilters = {
  selectedRatings: [],
  selectedCategory: null,
  selectedTag: null,
}

export type PracticeMode = 'flashcards' | 'quiz' | 'match' | 'puzzle'

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function applyFilters(entries: Entry[], f: PracticeFilters): Entry[] {
  return entries.filter((e) => {
    if (!e.includeInPractice) return false
    if (f.selectedRatings.length && !f.selectedRatings.includes(e.rating)) return false
    if (f.selectedCategory !== null && e.category !== f.selectedCategory) return false
    if (f.selectedTag !== null && !e.tags.some((t) => t.id === f.selectedTag)) return false
    return true
  })
}

export function usePracticeEntries(mode: PracticeMode, filters: PracticeFilters): Entry[] {
  const entries = useEntriesStore((s) => s.entries)
  const { selectedRatings, selectedCategory, selectedTag } = filters
  const ratingsKey = selectedRatings.join(',')

  return useMemo(() => {
    const base = applyFilters(entries, { selectedRatings, selectedCategory, selectedTag })
    if (mode === 'flashcards') return base
    if (mode === 'quiz' || mode === 'match') return base.filter((e) => e.category !== 'note')
    return base
      .filter((e) => !['note', 'grammar'].includes(e.category))
      .filter((e) => wordCount(e.word) <= 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, mode, ratingsKey, selectedCategory, selectedTag])
}

export function usePracticeTags(): EntryTag[] {
  const entries = useEntriesStore((s) => s.entries)
  return useMemo(() => {
    const seen = new Map<number, EntryTag>()
    entries.filter((e) => e.includeInPractice).forEach((e) => e.tags.forEach((t) => seen.set(t.id, t)))
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [entries])
}
