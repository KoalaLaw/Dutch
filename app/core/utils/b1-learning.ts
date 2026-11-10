// B1 practice state stays inside the existing backed-up noteData store.
export const B1_STATE_KEY = '__type_dutch_b1_practice_v1__'
export interface B1PracticeState {
  version: 1
  drafts: Record<string, string>
  speakingNotes: Record<string, string>
  checks: Record<string, number[]>
  answers: Record<string, number>
  completed: Record<string, boolean>
}
export function emptyB1State(): B1PracticeState {
  return { version: 1, drafts: {}, speakingNotes: {}, checks: {}, answers: {}, completed: {} }
}
export function parseB1State(raw?: string): B1PracticeState {
  const state = emptyB1State()
  try {
    const value = JSON.parse(raw || '{}')
    if (value?.version !== 1) return state
    for (const key of ['drafts', 'speakingNotes'] as const) {
      for (const [id, text] of Object.entries(value[key] || {})) if (typeof text === 'string') state[key][id] = text
    }
    for (const [id, items] of Object.entries(value.checks || {})) {
      if (Array.isArray(items)) state.checks[id] = [...new Set(items.filter(item => Number.isInteger(item) && item >= 0))]
    }
    for (const [id, answer] of Object.entries(value.answers || {})) if (Number.isInteger(answer) && Number(answer) >= 0) state.answers[id] = Number(answer)
    for (const [id, done] of Object.entries(value.completed || {})) if (done === true) state.completed[id] = true
  } catch { /* Keep other learning data untouched when this optional note is invalid. */ }
  return state
}
export function countDutchWords(text: string) {
  return text.normalize('NFC').match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0
}
export function isWritingReady(text: string, checks: number[], minimum: number, maximum: number, checkCount: number) {
  const words = countDutchWords(text)
  return words >= minimum && words <= maximum && Array.from({ length: checkCount }, (_, index) => index).every(index => checks.includes(index))
}
