import type { SupabaseClient } from '@supabase/supabase-js'
import type { EntriesMap, HealthEntry } from './types'

export async function fetchEntries(client: SupabaseClient, userId: string): Promise<EntriesMap> {
  const entries: EntriesMap = {}
  for (let from = 0; ; from += 500) {
    const { data, error } = await client.from('health_entries')
      .select('date,data').eq('user_id', userId).order('date').range(from, from + 499)
    if (error) throw error
    for (const row of data) entries[row.date] = { ...row.data, date: row.date } as HealthEntry
    if (data.length < 500) return entries
  }
}

export async function storeEntries(client: SupabaseClient, userId: string, entries: HealthEntry[], ignoreDuplicates = false): Promise<EntriesMap> {
  const { data, error } = await client.from('health_entries').upsert(
    entries.map(entry => ({ user_id: userId, date: entry.date, data: entry, updated_at: entry.updatedAt })),
    { onConflict: 'user_id,date', ignoreDuplicates },
  ).select('date,data')
  if (error) throw error
  return Object.fromEntries(data.map(row => [row.date, { ...row.data, date: row.date } as HealthEntry]))
}
