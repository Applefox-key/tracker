export type EntryCategory = 'word' | 'phrase' | 'grammar' | 'idiom' | 'note'

export interface Entry {
  id: number
  word: string
  explanation: string
  example: string
  category: EntryCategory
  tags: string[]
  rating: number
  includeInFlashcards: boolean
  createdAt: string
}
