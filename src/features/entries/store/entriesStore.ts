import { create } from 'zustand'
import { Entry } from '../types'

interface EntriesState {
  entries: Entry[]
  setEntries: (entries: Entry[]) => void
  addEntry: (entry: Omit<Entry, 'id' | 'createdAt'>) => void
  updateEntry: (id: number, updates: Partial<Omit<Entry, 'id' | 'createdAt'>>) => void
  removeEntry: (id: number) => void
}

export const useEntriesStore = create<EntriesState>((set) => ({
  entries: [],

  setEntries: (entries) => set({ entries }),

  addEntry: (data) =>
    set((state) => ({
      entries: [
        ...state.entries,
        {
          ...data,
          id: Math.max(0, ...state.entries.map((e) => e.id)) + 1,
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  updateEntry: (id, updates) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  removeEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    })),
}))
