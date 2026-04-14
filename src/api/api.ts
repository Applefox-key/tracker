import axios from 'axios'
import { apiClient, TOKEN_KEY, BASE_URL } from './client'
import type { Entry, EntryCategory, EntryTag } from '@/features/entries/types'
import type { User, LoginCredentials } from '@/features/auth/types'

// ── Raw server shapes ──────────────────────────────────────────────────────

/** Shape returned by the server for an entry */
interface RawEntry {
  id: number
  word: string
  explanation: string
  example: string
  category: EntryCategory
  tags: EntryTag[]
  rating: number
  includeInPractice: 0 | 1
  createdAt: string
  img?: string | null
}

/** Shape sent to the server when creating or updating an entry (tags handled separately) */
interface EntryPayload {
  word: string
  explanation: string
  example: string
  category: EntryCategory
  rating: number
  includeInPractice: 0 | 1
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
    tags: raw.tags,
    rating: raw.rating,
    includeInPractice: raw.includeInPractice === 1,
    createdAt: raw.createdAt,
    img: raw.img ?? null,
  }
}

/**
 * Build an authenticated URL for an entry image.
 * The server accepts auth via ?token= query param, so this URL works in <img src>.
 */
export function getEntryImageUrl(filename: string): string {
  const token = localStorage.getItem(TOKEN_KEY)
  return `${BASE_URL}/img/entry?img=${encodeURIComponent(filename)}${token ? `&token=${encodeURIComponent(token)}` : ''}`
}

/**
 * Send entry data (and optional image) as multipart/form-data.
 * The POST /entries endpoint always expects JSON.parse(req.body.data),
 * so we always use FormData for create. PATCH handles both, but we also
 * use FormData when an image operation is involved.
 */
async function entryFormDataRequest<T>(
  method: 'post' | 'patch',
  url: string,
  payload: object,
  imgFile?: File | null,
): Promise<T> {
  const formData = new FormData()
  formData.append('data', JSON.stringify(payload))
  if (imgFile) formData.append('imgfile', imgFile)
  const token = localStorage.getItem(TOKEN_KEY)
  const res = await axios.request<T>({
    method,
    url: `${BASE_URL}${url}`,
    data: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  })
  return res.data
}

function toPayload({ tags: _tags, ...entry }: Omit<Entry, 'id' | 'createdAt'>): EntryPayload {
  return {
    word: entry.word,
    explanation: entry.explanation,
    example: entry.example,
    category: entry.category,
    rating: entry.rating,
    includeInPractice: entry.includeInPractice ? 1 : 0,
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

  async uploadAvatar(file: File): Promise<User> {
    // Uses raw axios to avoid the data-wrapper interceptor (FormData must not be wrapped)
    const formData = new FormData()
    formData.append('avatar', file)
    const token = localStorage.getItem(TOKEN_KEY)
    const res = await axios.patch<{ data: User }>(`${BASE_URL}/users`, formData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    })
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

  async createEntry(data: Omit<Entry, 'id' | 'createdAt'>, imgFile?: File | null): Promise<Entry> {
    // Server POST /entries always does JSON.parse(req.body.data) → must use FormData
    const raw = await entryFormDataRequest<RawEntry>('post', '/entries', toPayload(data), imgFile)
    return toEntry(raw)
  },

  async updateEntry(
    id: number,
    data: Partial<Omit<Entry, 'id' | 'createdAt'>>,
    imgFile?: File | null,
    removeImg?: boolean,
  ): Promise<Entry> {
    const partial: Partial<EntryPayload> & { img?: string | null } = {}
    if (data.word !== undefined) partial.word = data.word
    if (data.explanation !== undefined) partial.explanation = data.explanation
    if (data.example !== undefined) partial.example = data.example
    if (data.category !== undefined) partial.category = data.category
    if (data.rating !== undefined) partial.rating = data.rating
    if (data.includeInPractice !== undefined)
      partial.includeInPractice = data.includeInPractice ? 1 : 0
    if (removeImg) partial.img = null

    if (imgFile || removeImg) {
      // Need FormData so multer can read file / detect img=null removal
      const raw = await entryFormDataRequest<RawEntry>('patch', `/entries/${id}`, partial, imgFile)
      return toEntry(raw)
    }

    const res = await apiClient.patch<RawEntry>(`/entries/${id}`, partial)
    return toEntry(res.data)
  },

  async deleteEntry(id: number): Promise<void> {
    await apiClient.delete(`/entries/${id}`)
  },
}

// ── Entry Tags API ─────────────────────────────────────────────────────────

export const entryTagsApi = {
  async getAll(): Promise<EntryTag[]> {
    const res = await apiClient.get<{ data: EntryTag[] }>('/entry-tags')
    return res.data.data ?? []
  },

  async create(name: string): Promise<{ id: number }> {
    const res = await apiClient.post<{ message: string; id: number }>('/entry-tags', { name })
    return { id: res.data.id }
  },

  async edit(id: number, name: string): Promise<EntryTag> {
    const res = await apiClient.patch<EntryTag>(`/entry-tags/${id}`, { name })
    return res.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/entry-tags/${id}`)
  },

  async getByEntry(entryId: number): Promise<EntryTag[]> {
    const res = await apiClient.get<{ data: EntryTag[] }>(`/entry-tags/entry/${entryId}`)
    return res.data.data ?? []
  },

  async setEntryTags(entryId: number, tagIds: number[]): Promise<void> {
    await apiClient.put(`/entry-tags/entry/${entryId}`, { tagIds })
  },
}
