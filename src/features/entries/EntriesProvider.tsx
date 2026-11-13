import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { fetchEntries, storeEntries } from './cloud'
import { cloneEntry } from './defaults'
import { EntriesContext, type EntriesContextValue } from './context'
import { loadEntries } from './storage'
import { supabase } from '../../shared/lib/supabase'
import type { EntriesMap, HealthEntry } from './types'
import { Card } from '../../shared/ui/Card'
import { Backdrop } from '../../shared/ui/Backdrop'

export function EntriesProvider({ children, user }: { children: ReactNode; user: User }) {
  const [entriesMap, setEntriesMap] = useState<EntriesMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const writing = useRef(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const entries = await fetchEntries(supabase!, user.id)
        if (!active) return
        setEntriesMap(entries)
        setError('')
      } catch {
        if (active) setError('Не удалось загрузить дневник. Проверьте интернет и доступ к таблице Supabase.')
      } finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [user.id, attempt])

  async function write(entries: HealthEntry[], ignoreDuplicates = false) {
    if (writing.current) throw new Error('Дождитесь завершения предыдущего сохранения.')
    writing.current = true
    try {
      const saved = await storeEntries(supabase!, user.id, entries, ignoreDuplicates)
      setEntriesMap(current => ({ ...current, ...saved }))
    } finally { writing.current = false }
  }

  const entriesList = Object.values(entriesMap).sort((a, b) => b.date.localeCompare(a.date))
  const value: EntriesContextValue = {
    entriesMap,
    entriesList,
    accountEmail: user.email ?? '',
    async saveEntry(entry) {
      await write([{ ...entry, updatedAt: new Date().toISOString() }])
    },
    async importLocalEntries() {
      const entries = Object.values(loadEntries())
      if (!entries.length) return
      // Conflicting dates stay as they are in the cloud, even if another device
      // created them after this page was loaded. Local originals are retained.
      await write(entries, true)
    },
    getEntry: date => entriesMap[date],
    getPreviousEntry: date => entriesList.find(entry => entry.date < date),
    duplicateFromPrevious(date) {
      const previous = entriesList.find(entry => entry.date < date)
      return previous ? cloneEntry(previous, date) : undefined
    },
  }

  if (loading || error) return <Backdrop><main className="relative mx-auto flex min-h-screen max-w-[460px] flex-col justify-center px-4 py-10"><Card className="space-y-4 p-7">
    <p role={error ? 'alert' : 'status'}>{error || 'Загружаем дневник…'}</p>
    {error && <button onClick={() => { setLoading(true); setError(''); setAttempt(value => value + 1) }} className="w-full rounded-2xl bg-accent-strong px-4 py-3 text-sm font-medium text-white shadow-chip">Повторить</button>}
    <button className="block text-sm text-muted underline" onClick={async () => {
      try {
        const { error } = await supabase!.auth.signOut({ scope: 'local' })
        if (error) throw error
      } catch { setError('Не удалось выйти. Попробуйте ещё раз.') }
    }}>Выйти из аккаунта</button>
  </Card></main></Backdrop>
  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
}
