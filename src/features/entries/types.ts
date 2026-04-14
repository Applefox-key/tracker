export type EntryCategory = 'word' | 'phrase' | 'grammar' | 'idiom' | 'note'

export interface EntryTag {
  id: number
  name: string
}

export interface Entry {
  id: number
  word: string
  explanation: string
  example: string
  category: EntryCategory
  tags: EntryTag[]
  rating: number
  includeInPractice: boolean
  createdAt: string
  img?: string | null
}
