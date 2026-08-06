import type { EntryCategory } from '@/features/entries/types'

export interface Flashcard {
  id: number
  front: string
  back: string
  hint?: string
  rating: number
  img?: string | null
  category: EntryCategory
}
