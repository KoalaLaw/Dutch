// Type Dutch adaptation: modified 2026-11-10. Upstream: zyronon/TypeWords, GPL-3.0.
import type { Word } from '../types'
import { withAppBaseURL } from '../utils/base-url'
let dictionary: Promise<Word[]> | undefined
export async function queryWord(params?: { word: string }) {
  dictionary ??= fetch(withAppBaseURL('/dicts/nl/word/all.json'))
    .then(response => { if (!response.ok) throw new Error('词库加载失败'); return response.json() as Promise<Word[]> })
    .catch(error => { dictionary = undefined; throw error })
  try {
    const query = (params?.word ?? '').trim().normalize('NFC').toLocaleLowerCase('nl')
    const words = await dictionary
    const data = words.find(entry => entry.word.toLocaleLowerCase('nl') === query)
      ?? words.find(entry => entry.word.replace(/^(de|het) /, '').toLocaleLowerCase('nl') === query)
    return { success: !!data, data: data ?? null, code: data ? 200 : 404, msg: data ? '' : '基础词库中暂无此词，可手动添加' }
  } catch {
    return { success: false, data: null, code: 503, msg: '词库暂时不可用，请重试' }
  }
}
