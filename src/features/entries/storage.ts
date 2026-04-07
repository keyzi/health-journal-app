import type { EntriesMap } from './types'

const STORAGE_KEY = 'quiet-health.entries.v1'

export function loadEntries(): EntriesMap {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as EntriesMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveEntries(entries: EntriesMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}
