import { computed, ref } from 'vue'
import { createEmptyCard, Rating, FSRS } from 'ts-fsrs'
import { useBaseStore } from '../stores/base'
import { useSettingStore } from '../stores/setting'
import { useDataSyncPersistence } from './useDataSyncPersistence'
import type { Word } from '../types'
import { withAppBaseURL } from '../utils/base-url'
import { DAILY_STATE_KEY, parseDailyState, emptyDailyDay, localStudyDate, type DailyState } from '../utils/daily-learning'

let wordsPromise: Promise<Word[]> | undefined
let saveQueue: Promise<unknown> = Promise.resolve()
let saveGeneration = 0
const saveStatus = ref<'saved'|'saving'|'error'>('saved')
export function loadDailyWords() {
  wordsPromise ??= fetch(withAppBaseURL('/dicts/nl/word/all.json')).then(response => {
    if (!response.ok) throw Error('词库加载失败')
    return response.json() as Promise<Word[]>
  }).catch(error => { wordsPromise = undefined; throw error })
  return wordsPromise
}
export function useDailyLearning() {
  const store = useBaseStore()
  const persistence = useDataSyncPersistence()
  const settings = useSettingStore()
  const state = computed(() => parseDailyState(store.noteData?.[DAILY_STATE_KEY]))
  function update(change: (value: DailyState) => void) {
    if (!store.load) return
    const value = parseDailyState(store.noteData[DAILY_STATE_KEY])
    change(value)
    store.noteData[DAILY_STATE_KEY] = JSON.stringify(value)
  }
  function updateDay(id: string, change: (day: ReturnType<typeof emptyDailyDay>, value: DailyState) => void) {
    update(value => { value.days[id] ??= emptyDailyDay(); change(value.days[id], value) })
  }
  function markTask(id: string, task: string, done = true) {
    updateDay(id, day => { day.done = done ? [...new Set([...day.done, task])] : day.done.filter(key => key !== task) })
  }
  async function flush() {
    if (!store.load) return
    const generation=++saveGeneration
    saveStatus.value='saving'
    const task=saveQueue.catch(()=>{}).then(()=>persistence.saveDictState(store.$state,{pullWhenRemoteNewer:false}))
    saveQueue=task
    try { await task; if(generation===saveGeneration)saveStatus.value='saved' }
    catch(error){ if(generation===saveGeneration)saveStatus.value='error'; throw error }
  }
  async function recordWord(word: Word, helped: boolean) {
    const previous = state.value.words[word.id]
    const today = localStudyDate()
    const old = store.fsrsData[word.word]
    const isDue = !old || new Date(old.due).getTime() <= Date.now()
    if (helped || (previous?.lastDate !== today && isDue)) {
      store.fsrsData[word.word] = new FSRS(settings.fsrsParameters).next(old ?? createEmptyCard(), new Date(), helped ? Rating.Again : Rating.Good).card
    }
    const card = store.fsrsData[word.word]
    update(value => {
      value.words[word.id] = { text: word.word, lastDate: today,
        due: card ? new Date(card.due).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        attempts: (previous?.attempts || 0) + 1, misses: (previous?.misses || 0) + (helped ? 1 : 0) }
    })
    if (helped && !store.wrong.words.some(entry => entry.word === word.word)) {
      store.wrong.words.push(word); store.wrong.length = store.wrong.words.length
    }

  }
  return { store, state, update, updateDay, markTask, flush, recordWord, saveStatus }
}
