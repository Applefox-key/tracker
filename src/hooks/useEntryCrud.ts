import { useAuthStore } from '@/features/auth/store/authStore'
import { useEntriesStore } from '@/features/entries/store/entriesStore'
import { useCreateEntry, useUpdateEntry, useDeleteEntry } from '@/hooks/useEntries'
import type { Entry } from '@/features/entries/types'

/**
 * Returns mode-aware CRUD operations for entries.
 *
 * - demo / unauthenticated → operates on local Zustand store only
 * - authenticated          → calls the server via TanStack Query mutations
 *                            (which invalidate ['entries'] and trigger a refetch
 *                             that syncs back into the store via useEntriesData)
 */
export function useEntryCrud() {
  const mode = useAuthStore((s) => s.mode)
  const storeAdd = useEntriesStore((s) => s.addEntry)
  const storeUpdate = useEntriesStore((s) => s.updateEntry)
  const storeRemove = useEntriesStore((s) => s.removeEntry)

  const createMutation = useCreateEntry()
  const updateMutation = useUpdateEntry()
  const deleteMutation = useDeleteEntry()

  function addEntry(data: Omit<Entry, 'id' | 'createdAt'>) {
    if (mode === 'authenticated') {
      createMutation.mutate(data)
    } else {
      storeAdd(data)
    }
  }

  function updateEntry(id: number, data: Partial<Omit<Entry, 'id' | 'createdAt'>>) {
    if (mode === 'authenticated') {
      updateMutation.mutate({ id, data })
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
