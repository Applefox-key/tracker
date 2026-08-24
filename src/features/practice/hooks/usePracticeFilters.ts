import { useState, useMemo } from 'react'
import type { EntryCategory } from '@/features/entries/types'
import type { MasteryFilter, PracticeFilters } from './usePracticeEntries'
import { usePracticeTags } from './usePracticeEntries'

export function usePracticeFilters() {
  const [selectedRatings, setSelectedRatings] = useState<number[]>([])
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null)
  const [selectedTag, setSelectedTag] = useState<number | null>(null)
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>(null)
  const [staleOnly, setStaleOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const allTags = usePracticeTags()

  const filters: PracticeFilters = useMemo(
    () => ({ selectedRatings, selectedCategory, selectedTag, masteryFilter, staleOnly }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedRatings.join(','), selectedCategory, selectedTag, masteryFilter, staleOnly],
  )

  const activeFilterCount = [
    selectedRatings.length > 0,
    selectedCategory !== null,
    selectedTag !== null,
    masteryFilter !== null,
    staleOnly,
  ].filter(Boolean).length

  function clearFilters() {
    setSelectedRatings([])
    setSelectedCategory(null)
    setSelectedTag(null)
    setMasteryFilter(null)
    setStaleOnly(false)
  }

  const filterPanelProps = {
    allTags,
    selectedCategory,
    onCategoryChange: setSelectedCategory,
    selectedTag,
    onTagChange: setSelectedTag,
    selectedRatings,
    onRatingsChange: setSelectedRatings,
    masteryFilter,
    onMasteryFilterChange: setMasteryFilter,
    staleOnly,
    onStaleOnlyChange: setStaleOnly,
  }

  return {
    filters,
    filterPanelProps,
    allTags,
    selectedRatings,
    setSelectedRatings,
    selectedCategory,
    setSelectedCategory,
    selectedTag,
    setSelectedTag,
    masteryFilter,
    setMasteryFilter,
    staleOnly,
    setStaleOnly,
    showFilters,
    setShowFilters,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    activeFilterCount,
    clearFilters,
  }
}

export type PracticeFilterState = ReturnType<typeof usePracticeFilters>
