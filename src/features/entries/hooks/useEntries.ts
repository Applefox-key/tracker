import { useState, useMemo } from 'react'
import { useEntriesStore } from '../store/entriesStore'
import { useEntryCrud } from '@/hooks/useEntryCrud'
import { EntryCategory } from '../types'

export function useEntries() {
  const entries = useEntriesStore((s) => s.entries)
  const { addEntry, removeEntry } = useEntryCrud()

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<EntryCategory | 'all'>('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedRatings, setSelectedRatings] = useState<number[]>([])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    entries.forEach((e) => e.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [entries])

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        e.word.toLowerCase().includes(search.toLowerCase()) ||
        e.explanation.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = filterCategory === 'all' || e.category === filterCategory
      const matchesTag = selectedTag === null || e.tags.includes(selectedTag)
      const matchesRating = selectedRatings.length === 0 || selectedRatings.includes(e.rating)
      return matchesSearch && matchesCategory && matchesTag && matchesRating
    })
  }, [entries, search, filterCategory, selectedTag, selectedRatings])

  const hasActiveFilters =
    search !== '' || filterCategory !== 'all' || selectedTag !== null || selectedRatings.length > 0

  function clearFilters() {
    setSearch('')
    setFilterCategory('all')
    setSelectedTag(null)
    setSelectedRatings([])
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
    hasActiveFilters,
    clearFilters,
    addEntry,
    removeEntry,
  }
}
