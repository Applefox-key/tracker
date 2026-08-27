import { useMemo } from 'react'
import { useEntriesStore } from '@/features/entries/store/entriesStore'
import type { Entry, EntryCategory, EntryTag } from '@/features/entries/types'
import { DateFilter } from './usePracticeFilters'


export type MasteryFilter = 'unmastered' | 'mastered' | null

export interface PracticeFilters {
  selectedRatings: number[]
  selectedCategory: EntryCategory | null
  selectedTag: number | null
  masteryFilter?: MasteryFilter
  staleOnly?: boolean
  dateFilter: DateFilter | null
}

export const EMPTY_FILTERS: PracticeFilters = {
  selectedRatings: [],
  selectedCategory: null,
  selectedTag: null,
  masteryFilter: null,
  staleOnly: false, dateFilter: null,
}

function isStale(lastReviewedAt: string | null | undefined): boolean {
  if (!lastReviewedAt) return true
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  return new Date(lastReviewedAt) < cutoff
}

export function inSelectedPeriod(createdAt: string | number | Date, dateFilter: DateFilter | null): boolean {

  if (dateFilter === null) return true;
  const cutoff = new Date()
  const day = dateFilter === 'month' ? 30 : dateFilter === 'days' ? 14 : dateFilter === 'week' ? 7 : 0;
  cutoff.setDate(cutoff.getDate() - day);
  cutoff.setHours(0, 0, 0, 0);
  return new Date(createdAt) >= cutoff;
}
export type PracticeMode = 'flashcards' | 'quiz' | 'match' | 'puzzle' | 'write'

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

export function applyFilters(entries: Entry[], f: PracticeFilters): Entry[] {
  return entries.filter((e) => {
    if (!e.includeInPractice) return false
    if (f.selectedRatings.length && !f.selectedRatings.includes(e.rating)) return false
    if (f.selectedCategory !== null && e.category !== f.selectedCategory) return false
    if (f.selectedTag !== null && !e.tags.some((t) => t.id === f.selectedTag)) return false
    if (f.masteryFilter === 'unmastered' && e.rating >= 5) return false
    if (f.masteryFilter === 'mastered' && e.rating < 5) return false
    if (f.staleOnly && !isStale(e.last_reviewed_at)) return false
    if (f.dateFilter !== null && !inSelectedPeriod(e.createdAt, f.dateFilter)) return false
    return true
  })
}

export function usePracticeEntries(mode: PracticeMode, filters: PracticeFilters): Entry[] {
  const entries = useEntriesStore((s) => s.entries)
  const { selectedRatings, selectedCategory, selectedTag, masteryFilter, staleOnly, dateFilter } = filters
  const ratingsKey = selectedRatings.join(',')

  return useMemo(() => {
    const base = applyFilters(entries, { selectedRatings, selectedCategory, selectedTag, masteryFilter, staleOnly, dateFilter })
    if (mode === 'flashcards') return base
    if (mode === 'quiz' || mode === 'match') return base.filter((e) => e.category !== 'note')
    if (mode === 'write') return base.filter((e) => ['word', 'phrase', 'idiom'].includes(e.category))
    return base
      .filter((e) => !['note', 'grammar'].includes(e.category))
      .filter((e) => wordCount(e.word) <= 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, mode, ratingsKey, selectedCategory, selectedTag, masteryFilter, staleOnly, dateFilter])
}

export function usePracticeTags(): EntryTag[] {
  const entries = useEntriesStore((s) => s.entries)
  return useMemo(() => {
    const seen = new Map<number, EntryTag>()
    entries.filter((e) => e.includeInPractice).forEach((e) => e.tags.forEach((t) => seen.set(t.id, t)))
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [entries])
}
