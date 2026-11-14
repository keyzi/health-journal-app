import { mealSuggestions, medicationSuggestions, painSuggestions } from '../entries/defaults'

export type JournalSettings = {
  medications: string[]
  pains: string[]
  meals: string[]
  scaleNames: { kg: string; st: string }
}

export type ListKind = 'medications' | 'pains' | 'meals'

export const listTitles: Record<ListKind, string> = {
  medications: 'Лекарства',
  pains: 'Типы боли',
  meals: 'Приёмы пищи',
}

export const defaultSettings: JournalSettings = {
  medications: medicationSuggestions,
  pains: painSuggestions,
  meals: mealSuggestions,
  scaleNames: { kg: 'КГ', st: 'СТ' },
}

// Ключ в user_metadata профиля Supabase: настройки едут вместе с аккаунтом.
export const SETTINGS_METADATA_KEY = 'journal_settings'

function stringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
  return Array.from(new Set(items.map((item) => item.trim())))
}

function name(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 40) : fallback
}

export function parseSettings(raw: unknown): JournalSettings {
  if (!raw || typeof raw !== 'object') return defaultSettings
  const data = raw as Record<string, unknown>
  const scales = (data.scaleNames && typeof data.scaleNames === 'object' ? data.scaleNames : {}) as Record<string, unknown>
  return {
    medications: stringList(data.medications, defaultSettings.medications),
    pains: stringList(data.pains, defaultSettings.pains),
    meals: stringList(data.meals, defaultSettings.meals),
    scaleNames: {
      kg: name(scales.kg, defaultSettings.scaleNames.kg),
      st: name(scales.st, defaultSettings.scaleNames.st),
    },
  }
}
