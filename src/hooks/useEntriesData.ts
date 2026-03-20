import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useEntriesStore } from '@/features/entries/store/entriesStore'
import { entriesApi } from '@/api/api'
import { MOCK_ENTRIES } from '@/data/mockEntries'

/**
 * Orchestrates the entries data source based on auth mode.
 *
 * - 'unauthenticated' → clears the store
 * - 'demo'            → seeds the store with local mock entries (no API calls)
 * - 'authenticated'   → fetches from server via TanStack Query, syncs into store
 *
 * Mount this once at the Layout level so all child pages read from the populated store.
 */
export function useEntriesData() {
  const mode = useAuthStore((s) => s.mode)
  const setEntries = useEntriesStore((s) => s.setEntries)

  // Server fetch — disabled in demo and unauthenticated modes
  const { data: serverEntries, isLoading } = useQuery({
    queryKey: ['entries'],
    queryFn: entriesApi.getEntries,
    enabled: mode === 'authenticated',
    staleTime: 30_000,
  })

  // Populate store based on mode change
  useEffect(() => {
    if (mode === 'demo') {
      setEntries(MOCK_ENTRIES)
    } else if (mode === 'unauthenticated') {
      setEntries([])
    }
  }, [mode, setEntries])

  // Sync server response into store
  useEffect(() => {
    if (serverEntries && mode === 'authenticated') {
      setEntries(serverEntries)
    }
  }, [serverEntries, mode, setEntries])

  return { isLoading: mode === 'authenticated' && isLoading }
}
