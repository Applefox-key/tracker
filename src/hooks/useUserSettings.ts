import { useAuthStore } from '@/features/auth/store/authStore'
import { authApi } from '@/api/api'
import {
  parseUserSettings,
  DEFAULT_SPEECH_LANGS,
  type LangCode,
  type TrackerSettings,
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

  const tracker: TrackerSettings = settings.tracker ?? {}

  async function saveSettings(patch: Partial<UserSettings>): Promise<void> {
    if (!user) return
    const next: UserSettings = { ...settings, ...patch }
    setUser({ ...user, settings: next as Record<string, unknown> })
    try {
      const updated = await authApi.updateUser({ settings: next as Record<string, unknown> })
      if (updated?.id) setUser(updated)
    } catch {
      setUser(user)
    }
  }

  async function saveSpeechLangs(langs: LangCode[]): Promise<void> {
    if (!user) {
      localStorage.setItem(LS_SPEECH_LANGS, JSON.stringify(langs))
      return
    }
    await saveSettings({ speechLangs: langs })
  }

  async function saveTracker(patch: Partial<TrackerSettings>): Promise<void> {
    await saveSettings({ tracker: { ...tracker, ...patch } })
  }

  return { settings, speechLangs, tracker, saveSpeechLangs, saveTracker }
}
