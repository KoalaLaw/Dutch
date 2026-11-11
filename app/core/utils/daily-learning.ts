export const DAILY_STATE_KEY = '__type_dutch_daily_v1__'
export interface DailyWordSession {
  ids: string[]; index: number; round: 'learn' | 'recall' | 'done'; missed: string[]; correct: number; input: string
}
export interface DailyDayState {
  done: string[]; answers: Record<string, number>; production: string; reflection: string; checks: number[]
  sessions: Record<string, DailyWordSession>; scores: Record<string, number>
}
export interface DailyWordRecord { text: string; lastDate: string; due: string; attempts: number; misses: number }
export interface DailyState {
  version: 1; startDay: number; days: Record<string, DailyDayState>; words: Record<string, DailyWordRecord>
  writingNotes: Record<string, string>
}
export function emptyDailyState(): DailyState {
  return { version: 1, startDay: 1, days: {}, words: {}, writingNotes: {} }
}
export function emptyDailyDay(): DailyDayState {
  return { done: [], answers: {}, production: '', reflection: '', checks: [], sessions: {}, scores: {} }
}
export function localStudyDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function parseDailyState(raw?: string): DailyState {
  const result = emptyDailyState()
  try {
    const value = JSON.parse(raw || '{}')
    if (value?.version !== 1) return result
    if (Number.isInteger(value.startDay) && value.startDay >= 1 && value.startDay <= 252) result.startDay = value.startDay
    for (const [id, saved] of Object.entries(value.days || {})) {
      if (!/^d\d{3}$/.test(id) || !saved || typeof saved !== 'object') continue
      const item = saved as any
      const day = emptyDailyDay()
      day.done = [...new Set<string>((Array.isArray(item.done) ? item.done : []).filter((key: unknown) => ['review','vocabulary','skill','check'].includes(String(key))))]
      day.production = typeof item.production === 'string' ? item.production : ''
      day.reflection = typeof item.reflection === 'string' ? item.reflection : ''
      day.checks = [...new Set<number>((Array.isArray(item.checks) ? item.checks : []).filter((n: unknown) => Number.isInteger(n) && Number(n) >= 0 && Number(n) < 10))]
      for (const [key, n] of Object.entries(item.answers || {})) if (Number.isInteger(n) && Number(n) >= 0 && Number(n) < 4) day.answers[key] = Number(n)
      for (const [key, n] of Object.entries(item.scores || {})) if (typeof n === 'number' && n >= 0 && n <= 1) day.scores[key] = n
      for (const [key, entry] of Object.entries(item.sessions || {})) {
        const session = entry as any
        if (!['review','vocabulary'].includes(key) || !Array.isArray(session?.ids) || !['learn','recall','done'].includes(session.round)) continue
        const ids = [...new Set<string>(session.ids.filter((word: unknown) => typeof word === 'string'))]
        day.sessions[key] = { ids, index: Math.max(0, Math.min(ids.length, Number.isInteger(session.index) ? session.index : 0)),
          round: session.round, missed: Array.isArray(session.missed) ? session.missed.filter((word: string) => ids.includes(word)) : [],
          correct: Math.max(0, Math.min(ids.length, Number(session.correct) || 0)), input: typeof session.input === 'string' ? session.input : '' }
      }
      result.days[id] = day
    }
    for (const [id, item] of Object.entries(value.words || {})) {
      const record = item as any
      if (typeof record?.text === 'string' && typeof record.due === 'string' && typeof record.lastDate === 'string') {
        result.words[id] = { text: record.text, due: record.due, lastDate: record.lastDate,
          attempts: Math.max(0, Number(record.attempts) || 0), misses: Math.max(0, Number(record.misses) || 0) }
      }
    }
    for (const [id, text] of Object.entries(value.writingNotes || {})) if (typeof text === 'string') result.writingNotes[id] = text
  } catch { /* An invalid optional plan never replaces the original course or learning data. */ }
  return result
}
export function dailyTaskKeys(day: { review: boolean }) { return day.review ? ['review','skill','check'] : ['review','vocabulary','skill'] }
export function isDailyComplete(day: { id: string; review: boolean }, state: DailyState) {
  const saved = state.days[day.id]
  return dailyTaskKeys(day).every(key => saved?.done.includes(key)) && (!day.review || (saved?.scores.review ?? 0) >= .8)
}
export function recommendedDay<T extends { id: string; number: number; review: boolean }>(days: T[], state: DailyState): T {
  return days.find(day => day.number >= state.startDay && !isDailyComplete(day, state)) ?? days[days.length - 1]
}
export function nonemptyLines(text: string) { return text.split('\n').map(line => line.trim()).filter(Boolean).length }
