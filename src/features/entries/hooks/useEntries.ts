import { useState, useMemo } from 'react'
import { useEntriesStore } from '../store/entriesStore'
import { useEntryCrud } from '@/hooks/useEntryCrud'
import { EntryCategory, EntryTag } from '../types'

export type DateFilter = 'all' | 'today' | 'week'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfWeek() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  d.setHours(0, 0, 0, 0)
  return d
}

export function useEntries(initialDateFilter: DateFilter = 'all') {
  const entries = useEntriesStore((s) => s.entries)
  const { addEntry, removeEntry } = useEntryCrud()

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<EntryCategory | 'all'>('all')
  const [selectedTag, setSelectedTag] = useState<number | null>(null)
  const [selectedRatings, setSelectedRatings] = useState<number[]>([])
  const [dateFilter, setDateFilter] = useState<DateFilter>(initialDateFilter)

  const allTags = useMemo(() => {
    const seen = new Map<number, EntryTag>()
    entries.forEach((e) => e.tags.forEach((t) => seen.set(t.id, t)))
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [entries])

  const filtered = useMemo(() => {
    const today = startOfToday()
    const week = startOfWeek()
    return [...entries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).filter((e) => {
      const matchesSearch =
        e.word.toLowerCase().includes(search.toLowerCase()) ||
        e.explanation.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = filterCategory === 'all' || e.category === filterCategory
      const matchesTag = selectedTag === null || e.tags.some((t) => t.id === selectedTag)
      const matchesRating = selectedRatings.length === 0 || selectedRatings.includes(e.rating)
      const matchesDate =
        dateFilter === 'all' ? true :
        dateFilter === 'today' ? new Date(e.createdAt) >= today :
        new Date(e.createdAt) >= week
      return matchesSearch && matchesCategory && matchesTag && matchesRating && matchesDate
    })
  }, [entries, search, filterCategory, selectedTag, selectedRatings, dateFilter])

  const hasActiveFilters =
    search !== '' || filterCategory !== 'all' || selectedTag !== null ||
    selectedRatings.length > 0 || dateFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setFilterCategory('all')
    setSelectedTag(null)
    setSelectedRatings([])
    setDateFilter('all')
  }

  return {
    entries: filtered,
    totalCount: entries.length,
    allTags,
    search,
    setSearch,
    filterCategory,
    setFilterCategory,
    selectedTag,
    setSelectedTag,
    selectedRatings,
    setSelectedRatings,
    dateFilter,
    setDateFilter,
    hasActiveFilters,
    clearFilters,
    addEntry,
    removeEntry,
  }
}
