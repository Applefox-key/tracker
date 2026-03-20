import { apiClient, TOKEN_KEY } from './client'
import type { Entry, EntryCategory } from '@/features/entries/types'
import type { User, LoginCredentials } from '@/features/auth/types'

// ── Raw server shapes ──────────────────────────────────────────────────────

/** Shape returned by the server for an entry (SQLite-specific types) */
interface RawEntry {
  id: number
  word: string
  explanation: string
  example: string
  category: EntryCategory
  tags: string          // JSON-encoded array
  rating: number
  includeInFlashcards: 0 | 1
  createdAt: string
}

/** Shape sent to the server when creating or updating an entry */
interface EntryPayload {
  word: string
  explanation: string
  example: string
  category: EntryCategory
  tags: string          // JSON-encoded array
  rating: number
  includeInFlashcards: 0 | 1
}

interface LoginResponse {
  token: string
  role: string
}

// ── Data converters ────────────────────────────────────────────────────────

function toEntry(raw: RawEntry): Entry {
  return {
    id: raw.id,
    word: raw.word,
    explanation: raw.explanation,
    example: raw.example,
    category: raw.category,
    tags: JSON.parse(raw.tags) as string[],
    rating: raw.rating,
    includeInFlashcards: raw.includeInFlashcards === 1,
    createdAt: raw.createdAt,
  }
}

function toPayload(entry: Omit<Entry, 'id' | 'createdAt'>): EntryPayload {
  return {
    word: entry.word,
    explanation: entry.explanation,
    example: entry.example,
    category: entry.category,
    tags: JSON.stringify(entry.tags),
    rating: entry.rating,
    includeInFlashcards: entry.includeInFlashcards ? 1 : 0,
  }
}

// ── Auth API ───────────────────────────────────────────────────────────────

export const authApi = {
  async register(data: LoginCredentials & { name: string }): Promise<void> {
    await apiClient.post('/users', data)
  },

  async login(credentials: LoginCredentials): Promise<{ role: string }> {
    const res = await apiClient.post<LoginResponse>('/users/login', credentials)
    const { token, role } = res.data
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem('Auth', 'true')
    return { role }
  },

  async getUser(): Promise<User> {
    const res = await apiClient.get<{ data: User }>('/users')
    return res.data.data
  },

  async updateUser(data: Partial<User>): Promise<User> {
    const res = await apiClient.patch<{ data: User }>('/users', data)
    return res.data.data
  },

  async logout(): Promise<void> {
    await apiClient.delete('/users/logout')
    localStorage.removeItem(TOKEN_KEY)
    localStorage.setItem('Auth', 'false')
  },

  async sendPasswordResetEmail(email: string): Promise<void> {
    await apiClient.post('/resetpassword', { email })
  },

  async checkResetToken(resetToken: string): Promise<void> {
    await apiClient.get('/resetpassword', { params: { resetToken } })
  },

  async setNewPassword(password: string, resetToken: string): Promise<void> {
    await apiClient.patch('/resetpassword', { password, resetToken })
  },
}

// ── Entries API ────────────────────────────────────────────────────────────

export const entriesApi = {
  async getEntries(): Promise<Entry[]> {
    const res = await apiClient.get<RawEntry[]>('/entries')
    return res.data.map(toEntry)
  },

  async getEntry(id: number): Promise<Entry> {
    const res = await apiClient.get<RawEntry>(`/entries/${id}`)
    return toEntry(res.data)
  },

  async createEntry(data: Omit<Entry, 'id' | 'createdAt'>): Promise<Entry> {
    const res = await apiClient.post<RawEntry>('/entries', toPayload(data))
    return toEntry(res.data)
  },

  async updateEntry(id: number, data: Partial<Omit<Entry, 'id' | 'createdAt'>>): Promise<Entry> {
    // Build a partial payload — only include fields that are being updated
    const partial: Partial<EntryPayload> = {}
    if (data.word !== undefined) partial.word = data.word
    if (data.explanation !== undefined) partial.explanation = data.explanation
    if (data.example !== undefined) partial.example = data.example
    if (data.category !== undefined) partial.category = data.category
    if (data.tags !== undefined) partial.tags = JSON.stringify(data.tags)
    if (data.rating !== undefined) partial.rating = data.rating
    if (data.includeInFlashcards !== undefined)
      partial.includeInFlashcards = data.includeInFlashcards ? 1 : 0

    const res = await apiClient.patch<RawEntry>(`/entries/${id}`, partial)
    return toEntry(res.data)
  },

  async deleteEntry(id: number): Promise<void> {
    await apiClient.delete(`/entries/${id}`)
  },
}
