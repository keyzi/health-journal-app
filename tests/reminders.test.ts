import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isDue, localMoment, parseTime } from '../supabase/functions/send-reminders/due.ts'

test('converts the current moment to the device time zone', () => {
  const now = new Date('2026-11-14T18:05:00Z')
  assert.deepEqual(localMoment(now, 'Europe/Moscow'), { date: '2026-11-14', minutes: 21 * 60 + 5 })
  assert.deepEqual(localMoment(now, 'Asia/Vladivostok'), { date: '2026-11-15', minutes: 4 * 60 + 5 })
  assert.deepEqual(localMoment(now, 'Not/AZone'), { date: '2026-11-14', minutes: 18 * 60 + 5 })
})

test('parses time with and without seconds', () => {
  assert.equal(parseTime('21:00'), 1260)
  assert.equal(parseTime('07:30:00'), 450)
})

test('sends once per local day inside the window after the chosen time', () => {
  const at = (minutes: number, date = '2026-11-14') => ({ date, minutes })
  assert.equal(isDue('21:00:00', null, at(20 * 60 + 59)), false)
  assert.equal(isDue('21:00:00', null, at(21 * 60)), true)
  assert.equal(isDue('21:00:00', null, at(23 * 60 + 59)), true)
  assert.equal(isDue('21:00:00', '2026-11-14', at(21 * 60 + 15)), false)
  assert.equal(isDue('21:00:00', '2026-11-13', at(21 * 60 + 15)), true)
  assert.equal(isDue('09:00:00', null, at(12 * 60)), false)
})
