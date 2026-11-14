import { createContext } from 'react'
import type { EntriesMap, HealthEntry } from './types'
import type { JournalSettings } from '../settings/journalSettings'

export type EntriesContextValue = {
  entriesMap: EntriesMap
  entriesList: HealthEntry[]
  saveEntry: (entry: HealthEntry) => Promise<void>
  getEntry: (date: string) => HealthEntry | undefined
  getPreviousEntry: (date: string) => HealthEntry | undefined
  duplicateFromPrevious: (date: string) => HealthEntry | undefined
  accountEmail: string
  importLocalEntries: () => Promise<void>
  settings: JournalSettings
  saveSettings: (settings: JournalSettings) => Promise<void>
}

export const EntriesContext = createContext<EntriesContextValue | null>(null)
