export type PainRecord = {
  type: string
  level: number
}

export type HealthEntry = {
  date: string
  weight: number | null
  medications: string[]
  pains: PainRecord[]
  sleepHours: number
  sleepQuality: number
  steps: number | null
  kgScore: number
  stScore: number
  stComment: string
  moodScore: number
  moodNote: string
  meals: string[]
  lastMealTime: string
  produceServings: number
  notes: string
  updatedAt: string
}

export type EntriesMap = Record<string, HealthEntry>
