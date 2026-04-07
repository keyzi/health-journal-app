export function getTodayKey() {
  return formatDateKey(new Date())
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatLongDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(date)
}

export function formatShortDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function getMonthMatrix(anchor: Date) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  const startDay = (start.getDay() + 6) % 7
  const daysInMonth = end.getDate()
  const cells: Array<Date | null> = []

  for (let index = 0; index < startDay; index += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(anchor.getFullYear(), anchor.getMonth(), day))
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

export function shiftMonth(anchor: Date, delta: number) {
  return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1)
}

export function getMonthLabel(anchor: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(anchor)
}
