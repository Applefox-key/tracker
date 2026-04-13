/** All language options available for speech/voice features */
export const ALL_SPEECH_LANGS = [
  { code: "en-US", label: "EN", name: "English" },
  { code: "ru-RU", label: "RU", name: "Russian" },
  { code: "uk-UA", label: "UK", name: "Ukrainian" },
  { code: "pl-PL", label: "PL", name: "Polish" },
  { code: "de-DE", label: "DE", name: "German" },
  { code: "fr-FR", label: "FR", name: "French" },
  { code: "es-ES", label: "ES", name: "Spanish" },
  { code: "zh-CN", label: "ZH", name: "Chinese" },
  { code: "ja-JP", label: "JA", name: "Japanese" },
  { code: "",      label: "AU", name: "Auto (browser)" },
] as const

export type LangCode = (typeof ALL_SPEECH_LANGS)[number]["code"]

/** Shown when the user hasn't configured anything */
export const DEFAULT_SPEECH_LANGS: LangCode[] = ["en-US"]

export interface UserSettings {
  speechLangs?: LangCode[]
}

/**
 * Parse the `settings` field returned by the server.
 * May arrive as a plain object or as a JSON string.
 */
export function parseUserSettings(raw: unknown): UserSettings {
  if (!raw) return {}
  if (typeof raw === "object") return raw as UserSettings
  const str = String(raw).trim()
  try { return JSON.parse(str) as UserSettings } catch { return {} }
}

export function serializeSettings(s: UserSettings): string {
  return JSON.stringify(s)
}
