import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { entriesApi } from '@/api/api'
import type { Entry } from '@/features/entries/types'

const ENTRIES_KEY = ['entries'] as const

/** Fetch all entries for the current user. Only fires when mode is 'authenticated'. */
export function useEntries() {
  const mode = useAuthStore((s) => s.mode)
  return useQuery({
    queryKey: ENTRIES_KEY,
    queryFn: entriesApi.getEntries,
    enabled: mode === 'authenticated',
  })
}

/** Create a new entry and refresh the list. */
export function useCreateEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<Entry, 'id' | 'createdAt'>) => entriesApi.createEntry(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTRIES_KEY })
    },
  })
}

/** Update an existing entry and refresh the list. */
export function useUpdateEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Entry, 'id' | 'createdAt'>> }) =>
      entriesApi.updateEntry(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTRIES_KEY })
    },
  })
}

/** Delete an entry and refresh the list. */
export function useDeleteEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => entriesApi.deleteEntry(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTRIES_KEY })
    },
  })
}
