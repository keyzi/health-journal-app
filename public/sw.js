const CACHE_NAME = 'quiet-health-v5'
const APP_SHELL = ['','index.html','manifest.webmanifest','icon-192.svg','icon-512.svg']
  .map((path) => new URL(path, self.registration.scope).href)
const INDEX_URL = new URL('index.html', self.registration.scope).href

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached || caches.match(INDEX_URL))

      return cached || networkFetch
    }),
  )
})

// Push-напоминания (см. supabase/functions/send-reminders)
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  const scope = self.registration.scope
  event.waitUntil(
    self.registration.showNotification(data.title || 'Quiet Health', {
      body: data.body || 'Как прошёл день?',
      icon: new URL('icon-192.svg', scope).href,
      badge: new URL('icon-192.svg', scope).href,
      tag: 'daily-reminder',
      renotify: true,
      lang: 'ru',
      data: { url: new URL('#/today', scope).href },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const client = clients.find((item) => item.url.startsWith(self.registration.scope))
      if (client) {
        return client.focus().then((focused) => (focused && 'navigate' in focused ? focused.navigate(url) : focused))
      }
      return self.clients.openWindow(url)
    }),
  )
})
