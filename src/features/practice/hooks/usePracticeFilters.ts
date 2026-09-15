import { useState, useMemo } from 'react'
import type { EntryCategory } from '@/features/entries/types'
import type { MasteryFilter, PracticeFilters, ReviewFilter } from './usePracticeEntries'
import { usePracticeTags } from './usePracticeEntries'
export type DateFilter = 'month' | 'days' | 'today' | 'week'

export function usePracticeFilters() {
  const [selectedRatings, setSelectedRatings] = useState<number[]>([])
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null)
  const [selectedTag, setSelectedTag] = useState<number | null>(null)
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>(null)
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>(null)
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const allTags = usePracticeTags()

  const filters: PracticeFilters = useMemo(
    () => ({ selectedRatings, selectedCategory, selectedTag, masteryFilter, reviewFilter, dateFilter }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedRatings.join(','), selectedCategory, selectedTag, masteryFilter, reviewFilter, dateFilter],
  )

  const activeFilterCount = [
    selectedRatings.length > 0,
    selectedCategory !== null,
    selectedTag !== null,
    masteryFilter !== null,
    reviewFilter !== null,
    dateFilter !== null,
  ].filter(Boolean).length

  function clearFilters() {
    setSelectedRatings([])
    setSelectedCategory(null)
    setSelectedTag(null)
    setMasteryFilter(null)
    setReviewFilter(null)
    setDateFilter(null)
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
    reviewFilter,
    onReviewFilterChange: setReviewFilter,
    dateFilter,
    onDateFilterChange: setDateFilter,
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
    reviewFilter,
    setReviewFilter,
    showFilters,
    setShowFilters,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    activeFilterCount,
    clearFilters,
    setDateFilter,
  }
}

export type PracticeFilterState = ReturnType<typeof usePracticeFilters>
