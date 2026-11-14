export const moods = [
  { score: 2, emoji: '😣', label: 'тяжело' },
  { score: 4, emoji: '😕', label: 'так себе' },
  { score: 6, emoji: '😐', label: 'ровно' },
  { score: 8, emoji: '🙂', label: 'хорошо' },
  { score: 10, emoji: '😊', label: 'легко' },
]

export function closestMood(score: number) {
  return moods.reduce((best, mood) =>
    Math.abs(mood.score - score) < Math.abs(best.score - score) ? mood : best,
  )
}

export function maxPainLevel(pains: { level: number }[]) {
  return pains.reduce((max, pain) => Math.max(max, pain.level), 0)
}
