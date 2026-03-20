import { create } from 'zustand'

interface FlashcardsState {
  currentIndex: number
  isFlipped: boolean
  goNext: (total: number) => void
  goPrev: (total: number) => void
  flip: () => void
  reset: () => void
}

export const useFlashcardsStore = create<FlashcardsState>((set) => ({
  currentIndex: 0,
  isFlipped: false,

  goNext: (total) =>
    set((state) => ({
      currentIndex: total > 0 ? (state.currentIndex + 1) % total : 0,
      isFlipped: false,
    })),

  goPrev: (total) =>
    set((state) => ({
      currentIndex: total > 0 ? (state.currentIndex - 1 + total) % total : 0,
      isFlipped: false,
    })),

  flip: () => set((state) => ({ isFlipped: !state.isFlipped })),

  reset: () => set({ currentIndex: 0, isFlipped: false }),
}))
