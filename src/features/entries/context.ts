import { createContext } from 'react'
import type { EntriesMap, HealthEntry } from './types'

export type EntriesContextValue = {
  entriesMap: EntriesMap
  entriesList: HealthEntry[]
  saveEntry: (entry: HealthEntry) => Promise<void>
  getEntry: (date: string) => HealthEntry | undefined
  getPreviousEntry: (date: string) => HealthEntry | undefined
  duplicateFromPrevious: (date: string) => HealthEntry | undefined
  accountEmail: string
  importLocalEntries: () => Promise<void>
}

export const EntriesContext = createContext<EntriesContextValue | null>(null)
