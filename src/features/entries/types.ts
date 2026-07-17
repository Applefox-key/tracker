export type EntryCategory = 'word' | 'phrase' | 'grammar' | 'idiom' | 'note'

export type SRGrade = 0 | 3 | 4 | 5
export type PracticeMode = 'flashcard' | 'quiz' | 'match' | 'puzzle'

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
  ease_factor?: number
  interval_days?: number
  repetitions?: number
  next_review_at?: string | null
  last_reviewed_at?: string | null
  mastery_level?: number
}
