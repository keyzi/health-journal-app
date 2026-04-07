import type { HealthEntry } from './types'

export const medicationSuggestions = [
  'Витамин D',
  'Магний',
  'Омега-3',
  'Железо',
  'Пробиотик',
]

export const painSuggestions = [
  'Голова',
  'Шея',
  'Спина',
  'Живот',
  'Суставы',
]

export const mealSuggestions = [
  'Завтрак',
  'Обед',
  'Ужин',
  'Перекус',
  'Кофе',
]

export function createEmptyEntry(date: string): HealthEntry {
  return {
    date,
    weight: null,
    medications: [],
    pains: [],
    sleepHours: 7,
    sleepQuality: 7,
    steps: null,
    kgScore: 5,
    stScore: 5,
    stComment: '',
    moodScore: 6,
    moodNote: '',
    meals: [],
    lastMealTime: '',
    produceServings: 3,
    notes: '',
    updatedAt: new Date().toISOString(),
  }
}

export function cloneEntry(entry: HealthEntry, date = entry.date): HealthEntry {
  return {
    ...entry,
    date,
    medications: [...entry.medications],
    pains: entry.pains.map((pain) => ({ ...pain })),
    meals: [...entry.meals],
    updatedAt: new Date().toISOString(),
  }
}
