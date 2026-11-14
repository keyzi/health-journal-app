// Edge Function: ежедневные push-напоминания заполнить дневник.
//
// Два режима:
// 1. Расписание (pg_cron) вызывает функцию с заголовком Authorization: Bearer <CRON_SECRET>.
//    Функция находит устройства, у которых наступило время напоминания и день ещё не заполнен.
// 2. Пользователь из приложения просит тестовое уведомление: запрос несёт его токен входа,
//    уведомление уходит только на его устройства.
//
// Проверка JWT на уровне платформы должна быть выключена (verify_jwt = false):
// функция сама проверяет секрет расписания или токен пользователя.
//
// Секреты: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET.
// SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY платформа задаёт сама.

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { isDue, localMoment } from './due.ts'

type Subscription = {
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  remind_at: string
  timezone: string
  last_sent_on: string | null
}

const env = (name: string) => {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Не задан секрет ${name}`)
  return value
}

const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
})

webpush.setVapidDetails(env('VAPID_SUBJECT'), env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const reminderPayload = JSON.stringify({
  title: 'Quiet Health',
  body: 'Как прошёл день? Запись займёт пару минут.',
})

const testPayload = JSON.stringify({
  title: 'Quiet Health',
  body: 'Тестовое напоминание: уведомления работают.',
})

// true — отправлено; false — подписка больше не действует и удалена
async function send(subscription: Subscription, payload: string) {
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      payload,
      { TTL: 60 * 60 * 3, urgency: 'normal' },
    )
    return true
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) {
      await admin.from('push_subscriptions').delete()
        .eq('user_id', subscription.user_id).eq('endpoint', subscription.endpoint)
      return false
    }
    throw error
  }
}

async function runScheduled() {
  const { data, error } = await admin.from('push_subscriptions').select('*')
  if (error) throw error

  const now = new Date()
  const result = { checked: data.length, sent: 0, skippedFilled: 0, removed: 0, failed: 0 }

  for (const subscription of data as Subscription[]) {
    const local = localMoment(now, subscription.timezone)
    if (!isDue(subscription.remind_at, subscription.last_sent_on, local)) continue

    const markSent = () => admin.from('push_subscriptions')
      .update({ last_sent_on: local.date, updated_at: now.toISOString() })
      .eq('user_id', subscription.user_id).eq('endpoint', subscription.endpoint)

    // День уже заполнен — не беспокоим
    const { count, error: entryError } = await admin.from('health_entries')
      .select('date', { count: 'exact', head: true })
      .eq('user_id', subscription.user_id).eq('date', local.date)
    if (entryError) { result.failed++; continue }
    if (count) {
      await markSent()
      result.skippedFilled++
      continue
    }

    try {
      if (await send(subscription, reminderPayload)) {
        await markSent()
        result.sent++
      } else {
        result.removed++
      }
    } catch (sendError) {
      // Временная ошибка сервиса push: попробуем на следующем запуске
      console.error('push failed', subscription.endpoint.slice(0, 60), sendError)
      result.failed++
    }
  }
  return result
}

async function runTest(userId: string) {
  const { data, error } = await admin.from('push_subscriptions').select('*').eq('user_id', userId)
  if (error) throw error
  let sent = 0
  for (const subscription of data as Subscription[]) {
    if (await send(subscription, testPayload)) sent++
  }
  return { devices: data.length, sent }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'unauthorized' }, 401)

  try {
    if (token === env('CRON_SECRET')) return json(await runScheduled())

    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) return json({ error: 'unauthorized' }, 401)
    return json(await runTest(user.id))
  } catch (error) {
    console.error(error)
    return json({ error: 'internal error' }, 500)
  }
})
