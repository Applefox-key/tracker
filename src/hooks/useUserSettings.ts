import { useAuthStore } from '@/features/auth/store/authStore'
import { authApi } from '@/api/api'
import {
  parseUserSettings,
  DEFAULT_SPEECH_LANGS,
  type LangCode,
  type UserSettings,
} from '@/lib/userSettings'

const LS_SPEECH_LANGS = 'speech_langs'

function readLocalLangs(): LangCode[] {
  try {
    const raw = localStorage.getItem(LS_SPEECH_LANGS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as LangCode[]
    }
  } catch { /* ignore */ }
  return DEFAULT_SPEECH_LANGS
}

export function useUserSettings() {
  const { user, setUser } = useAuthStore()
  const settings = parseUserSettings(user?.settings)

  const speechLangs: LangCode[] =
    user
      ? settings.speechLangs && settings.speechLangs.length > 0
        ? settings.speechLangs
        : DEFAULT_SPEECH_LANGS
      : readLocalLangs()

  async function saveSpeechLangs(langs: LangCode[]): Promise<void> {
    if (!user) {
      // Demo / unauthenticated: persist to localStorage only
      localStorage.setItem(LS_SPEECH_LANGS, JSON.stringify(langs))
      return
    }

    const next: UserSettings = { ...settings, speechLangs: langs }

    // Optimistic update — components see new langs immediately
    setUser({ ...user, settings: next as Record<string, unknown> })

    try {
      const updated = await authApi.updateUser({ settings: next as Record<string, unknown> })
      if (updated?.id) setUser(updated)
    } catch {
      // Revert on error
      setUser(user)
    }
  }

  return { settings, speechLangs, saveSpeechLangs }
}
