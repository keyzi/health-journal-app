import { useEffect, useState, type ReactNode } from 'react'
import { cloneEntry } from './defaults'
import { EntriesContext, type EntriesContextValue } from './context'
import { loadEntries, saveEntries } from './storage'
import type { EntriesMap } from './types'

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [entriesMap, setEntriesMap] = useState<EntriesMap>(() => loadEntries())

  useEffect(() => {
    saveEntries(entriesMap)
  }, [entriesMap])

  const entriesList = Object.values(entriesMap).sort((left, right) =>
    right.date.localeCompare(left.date),
  )

  const value: EntriesContextValue = {
    entriesMap,
    entriesList,
    saveEntry(entry) {
      setEntriesMap((current) => ({
        ...current,
        [entry.date]: {
          ...entry,
          updatedAt: new Date().toISOString(),
        },
      }))
    },
    getEntry(date) {
      return entriesMap[date]
    },
    getPreviousEntry(date) {
      return entriesList.find((entry) => entry.date < date)
    },
    duplicateFromPrevious(date) {
      const previous = entriesList.find((entry) => entry.date < date)
      return previous ? cloneEntry(previous, date) : undefined
    },
    clearEntries() {
      setEntriesMap({})
    },
  }

  return (
    <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
  )
}
