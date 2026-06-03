import { ALL_SPEECH_LANGS, type LangCode } from './userSettings'

/** Convert BCP-47 code (e.g. "en-US") to MyMemory langpair part (e.g. "en") */
function toMyMemoryCode(code: LangCode): string {
  if (!code) return 'en'
  const idx = code.indexOf('-')
  return idx !== -1 ? code.slice(0, idx) : code
}

export async function translateText(text: string, from: LangCode, to: LangCode): Promise<string> {
  const pair = `${toMyMemoryCode(from)}|${toMyMemoryCode(to)}`
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`,
  )
  if (!res.ok) throw new Error('Translation request failed')
  const data = await res.json() as { responseStatus: number; responseData?: { translatedText: string }; responseDetails?: string }
  if (data.responseStatus !== 200) throw new Error(data.responseDetails ?? 'Translation failed')
  return data.responseData?.translatedText ?? ''
}

/** Pick sensible default from/to from the user's speechLangs list */
export function getDefaultLangPair(speechLangs: LangCode[]): { from: LangCode; to: LangCode } | null {
  const valid = speechLangs.filter((c) => c !== '')
  if (valid.length < 2) return null
  const enIdx = valid.findIndex((c) => c.startsWith('en'))
  if (enIdx !== -1) {
    const other = valid.find((_, i) => i !== enIdx)!
    return { from: valid[enIdx], to: other }
  }
  return { from: valid[0], to: valid[1] }
}

/** Short display label for a LangCode (e.g. "en-US" → "EN") */
export function langLabel(code: LangCode): string {
  return ALL_SPEECH_LANGS.find((l) => l.code === code)?.label ?? code.slice(0, 2).toUpperCase()
}
