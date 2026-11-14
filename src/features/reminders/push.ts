import { supabase } from '../../shared/lib/supabase'

// Публичный VAPID-ключ: его половина-секрет хранится только в Supabase.
const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type ReminderState = {
  enabled: boolean
  time: string
}

// Почему напоминание нельзя включить на этом устройстве
export type Unavailable =
  | 'not-configured' // нет VITE_VAPID_PUBLIC_KEY при сборке
  | 'dev' // в режиме разработки service worker не регистрируется
  | 'ios-not-installed' // iPhone: push только в приложении с экрана «Домой»
  | 'unsupported' // браузер не умеет push
  | 'denied' // уведомления запрещены в настройках браузера

const DEFAULT_TIME = '21:00'

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function checkAvailability(): Unavailable | null {
  if (!vapidPublicKey) return 'not-configured'
  if (import.meta.env.DEV) return 'dev'
  if (isIos() && !isStandalone()) return 'ios-not-installed'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported'
  }
  if (Notification.permission === 'denied') return 'denied'
  return null
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

async function registration() {
  return navigator.serviceWorker.ready
}

async function userId() {
  const { data, error } = await supabase!.auth.getUser()
  if (error || !data.user) throw error ?? new Error('Нет входа')
  return data.user.id
}

function timeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow'
}

export async function loadReminder(): Promise<ReminderState> {
  if (checkAvailability()) return { enabled: false, time: DEFAULT_TIME }
  const subscription = await (await registration()).pushManager.getSubscription()
  if (!subscription) return { enabled: false, time: DEFAULT_TIME }
  const { data, error } = await supabase!
    .from('push_subscriptions')
    .select('remind_at')
    .eq('endpoint', subscription.endpoint)
    .maybeSingle()
  if (error) throw error
  return data
    ? { enabled: true, time: String(data.remind_at).slice(0, 5) }
    : { enabled: false, time: DEFAULT_TIME }
}

export async function enableReminder(time: string) {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('permission')

  const reg = await registration()
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey!),
    }))
  const json = subscription.toJSON()
  const { error } = await supabase!.from('push_subscriptions').upsert(
    {
      user_id: await userId(),
      endpoint: subscription.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      remind_at: time,
      timezone: timeZone(),
      last_sent_on: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' },
  )
  if (error) throw error
}

export async function updateReminderTime(time: string) {
  const subscription = await (await registration()).pushManager.getSubscription()
  if (!subscription) throw new Error('Нет подписки')
  // Новое время могло ещё не наступить сегодня: сбрасываем отметку об отправке
  const { error } = await supabase!
    .from('push_subscriptions')
    .update({ remind_at: time, timezone: timeZone(), last_sent_on: null, updated_at: new Date().toISOString() })
    .eq('endpoint', subscription.endpoint)
  if (error) throw error
}

export async function disableReminder() {
  const subscription = await (await registration()).pushManager.getSubscription()
  if (!subscription) return
  const { error } = await supabase!.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  if (error) throw error
  await subscription.unsubscribe()
}

export async function sendTestReminder() {
  const { data, error } = await supabase!.functions.invoke<{ devices: number; sent: number }>('send-reminders', {
    body: { test: true },
  })
  if (error) throw error
  return data
}
