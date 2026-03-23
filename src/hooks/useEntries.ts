import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { entriesApi, entryTagsApi } from '@/api/api'
import type { Entry } from '@/features/entries/types'

const ENTRIES_KEY = ['entries'] as const
const ENTRY_TAGS_KEY = ['entry-tags'] as const

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

// ── Entry tag hooks ────────────────────────────────────────────────────────

/** Fetch all available tags. Only fires when mode is 'authenticated'. */
export function useEntryTags() {
  const mode = useAuthStore((s) => s.mode)
  return useQuery({
    queryKey: ENTRY_TAGS_KEY,
    queryFn: entryTagsApi.getAll,
    enabled: mode === 'authenticated',
  })
}

/** Associate a set of tag IDs with an entry (replaces existing associations). */
export function useSetEntryTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entryId, tagIds }: { entryId: number; tagIds: number[] }) =>
      entryTagsApi.setEntryTags(entryId, tagIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTRIES_KEY })
      await queryClient.invalidateQueries({ queryKey: ENTRY_TAGS_KEY })
    },
  })
}

/** Create a new tag. */
export function useCreateEntryTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => entryTagsApi.create(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTRY_TAGS_KEY })
    },
  })
}

/** Delete a tag by ID. */
export function useDeleteEntryTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => entryTagsApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTRIES_KEY })
      await queryClient.invalidateQueries({ queryKey: ENTRY_TAGS_KEY })
    },
  })
}
