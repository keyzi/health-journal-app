import { createContext } from 'react'
import type { EntriesMap, HealthEntry } from './types'

export type EntriesContextValue = {
  entriesMap: EntriesMap
  entriesList: HealthEntry[]
  saveEntry: (entry: HealthEntry) => void
  getEntry: (date: string) => HealthEntry | undefined
  getPreviousEntry: (date: string) => HealthEntry | undefined
  duplicateFromPrevious: (date: string) => HealthEntry | undefined
  clearEntries: () => void
}

export const EntriesContext = createContext<EntriesContextValue | null>(null)
