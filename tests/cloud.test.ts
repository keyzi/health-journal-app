import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { fetchEntries, storeEntries } from '../src/features/entries/cloud.ts'
import { createEmptyEntry } from '../src/features/entries/defaults.ts'

function client(fetcher: typeof fetch) {
  return createClient('https://example.supabase.co', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetcher },
  })
}

test('loads all pages and filters each request by the current account', async () => {
  let calls = 0
  const sdk = client(async (input) => {
    const url = new URL(String(input))
    assert.equal(url.searchParams.get('user_id'), 'eq.account-a')
    assert.equal(url.searchParams.get('offset'), String(calls * 500))
    const rows = calls++ === 0
      ? Array.from({ length: 500 }, (_, i) => ({ date: String(i), data: { notes: 'test' } }))
      : [{ date: 'last', data: { notes: 'last page' } }]
    return Response.json(rows)
  })
  const result = await fetchEntries(sdk, 'account-a')
  assert.equal(Object.keys(result).length, 501)
  assert.equal(result.last.notes, 'last page')
})

test('import uses ignore duplicates and attaches the signed-in account', async () => {
  const entry = createEmptyEntry('2026-11-13')
  const sdk = client(async (_input, init) => {
    assert.match(new Headers(init?.headers).get('Prefer') ?? '', /resolution=ignore-duplicates/)
    const rows = JSON.parse(String(init?.body))
    assert.equal(rows[0].user_id, 'account-b')
    assert.equal(rows[0].date, entry.date)
    return Response.json([]) // Existing date skipped by the server.
  })
  assert.deepEqual(await storeEntries(sdk, 'account-b', [entry], true), {})
})

test('save merges a date and only returns server-confirmed data', async () => {
  const entry = createEmptyEntry('2026-11-13')
  const sdk = client(async (_input, init) => {
    assert.match(new Headers(init?.headers).get('Prefer') ?? '', /resolution=merge-duplicates/)
    return Response.json([{ date: entry.date, data: entry }])
  })
  assert.deepEqual(await storeEntries(sdk, 'account-a', [entry]), { [entry.date]: entry })
})

test('database failure rejects loading and saving instead of reporting success', async () => {
  const sdk = client(async () => Response.json({ message: 'denied', code: '42501' }, { status: 403 }))
  await assert.rejects(fetchEntries(sdk, 'account-a'))
  await assert.rejects(storeEntries(sdk, 'account-a', [createEmptyEntry('2026-11-13')]))
})
