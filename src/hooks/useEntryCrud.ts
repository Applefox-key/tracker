import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useEntriesStore } from '@/features/entries/store/entriesStore'
import { useCreateEntry, useUpdateEntry, useDeleteEntry } from '@/hooks/useEntries'
import { entryTagsApi } from '@/api/api'
import type { Entry } from '@/features/entries/types'

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

  async function addEntry(data: Omit<Entry, 'id' | 'createdAt'>, tagIds?: number[], imgFile?: File | null) {
    if (mode === 'authenticated') {
      const created = await createMutation.mutateAsync({ data, imgFile })
      if (tagIds && tagIds.length > 0) {
        await entryTagsApi.setEntryTags(created.id, tagIds)
        await queryClient.invalidateQueries({ queryKey: ['entries'] })
      }
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
    } else {
      storeRemove(id)
    }
  }

  return { addEntry, updateEntry, removeEntry }
}
