// Чистая логика расписания: без сети и окружения, проверяется тестами.

// Окно, в течение которого напоминание ещё уместно. Если расписание
// пропустило время (сбой, пауза проекта), поздно ночью не будим.
export const SEND_WINDOW_MINUTES = 180

export type LocalMoment = { date: string; minutes: number }

// Локальные дата и минуты от полуночи в часовом поясе устройства
export function localMoment(now: Date, timeZone: string): LocalMoment {
  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now)
  } catch {
    // Неизвестный часовой пояс: считаем по UTC, а не падаем
    return localMoment(now, 'UTC')
  }
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  }
}

// '21:00' или '21:00:00' → минуты от полуночи
export function parseTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

export function isDue(remindAt: string, lastSentOn: string | null, local: LocalMoment) {
  if (lastSentOn === local.date) return false
  const target = parseTime(remindAt)
  return local.minutes >= target && local.minutes < target + SEND_WINDOW_MINUTES
}
