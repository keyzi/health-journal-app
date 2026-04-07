import { useContext } from 'react'
import { EntriesContext } from './context'

export function useEntries() {
  const context = useContext(EntriesContext)
  if (!context) {
    throw new Error('useEntries must be used within EntriesProvider')
  }
  return context
}
