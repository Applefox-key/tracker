import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useEntriesStore } from '@/features/entries/store/entriesStore'
import { useCreateEntry, useUpdateEntry, useDeleteEntry, useReviewEntry } from '@/hooks/useEntries'
import { entryTagsApi, entriesApi } from '@/api/api'
import type { Entry, EntryCategory, SRGrade, PracticeMode } from '@/features/entries/types'

export interface BatchEntryInput {
  word: string
  explanation: string
  example: string
  category: EntryCategory
  rating: number
  includeInPractice: boolean
}

/**
 * Returns mode-aware CRUD operations for entries.
 *
 * - demo / unauthenticated → operates on local Zustand store only
 * - authenticated          → calls the server via TanStack Query mutations,
 *                            then sets tag associations via entryTagsApi
 */
export function useEntryCrud() {
  const mode = useAuthStore((s) => s.mode)
  const storeAdd = useEntriesStore((s) => s.addEntry)
  const storeUpdate = useEntriesStore((s) => s.updateEntry)
  const storeRemove = useEntriesStore((s) => s.removeEntry)
  const queryClient = useQueryClient()

  const createMutation = useCreateEntry()
  const updateMutation = useUpdateEntry()
  const deleteMutation = useDeleteEntry()
  const reviewMutation = useReviewEntry()

  async function addEntry(data: Omit<Entry, 'id' | 'createdAt'>, tagIds?: number[], imgFile?: File | null) {
    if (mode === 'authenticated') {
      const created = await createMutation.mutateAsync({ data, imgFile })
      if (tagIds && tagIds.length > 0) {
        await entryTagsApi.setEntryTags(created.id, tagIds)
        await queryClient.invalidateQueries({ queryKey: ['entries'] })
      }
      queryClient.invalidateQueries({ queryKey: ['weeklyStats'] })
    } else {
      storeAdd({ ...data, tags: [] })
    }
  }

  async function updateEntry(
    id: number,
    data: Partial<Omit<Entry, 'id' | 'createdAt'>>,
    tagIds?: number[],
    imgFile?: File | null,
    removeImg?: boolean,
  ) {
    if (mode === 'authenticated') {
      await updateMutation.mutateAsync({ id, data, imgFile, removeImg })
      if (tagIds !== undefined) {
        await entryTagsApi.setEntryTags(id, tagIds)
        await queryClient.invalidateQueries({ queryKey: ['entries'] })
      }
    } else {
      storeUpdate(id, data)
    }
  }

  function removeEntry(id: number) {
    if (mode === 'authenticated') {
      deleteMutation.mutate(id)
      queryClient.invalidateQueries({ queryKey: ['weeklyStats'] })
    } else {
      storeRemove(id)
    }
  }

  function reviewEntry(id: number, grade: SRGrade, practiceMode: PracticeMode, isDue = false) {
    if (mode === 'authenticated') {
      reviewMutation.mutate({ id, grade, mode: practiceMode, isDue })
      queryClient.invalidateQueries({ queryKey: ['weeklyStats'] })
    }
  }

  async function resetMastery(id: number) {
    if (mode === 'authenticated') {
      await entriesApi.resetMastery(id)
      await queryClient.invalidateQueries({ queryKey: ['entries'] })
    }
  }

  async function addBatchEntries(entries: BatchEntryInput[], tagIds: number[]): Promise<{ count: number }> {
    if (mode === 'authenticated') {
      const result = await entriesApi.batchCreateEntries(entries, tagIds)
      await queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['weeklyStats'] })
      return { count: result.count }
    } else {
      for (const e of entries) storeAdd({ ...e, tags: [] })
      return { count: entries.length }
    }
  }

  return { addEntry, updateEntry, removeEntry, reviewEntry, resetMastery, addBatchEntries }
}
