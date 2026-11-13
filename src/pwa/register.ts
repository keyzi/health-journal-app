export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  // В разработке service worker отдаёт закэшированные старые файлы
  // и прячет правки. Снимаем его и чистим кэш, регистрируем только в сборке.
  if (import.meta.env.DEV) {
    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
      .then(() => caches.keys())
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => undefined)
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined)
  })
}
