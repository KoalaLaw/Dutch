import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { packs, dialogues } from '../content/dutch-course.mjs'

const writeJSON = async (file, data) => {
  await mkdir(dirname(fileURLToPath(new URL('../' + file, import.meta.url))), { recursive: true })
  await writeFile(new URL('../' + file, import.meta.url), JSON.stringify(data, null, 2) + '\n')
}
const all = []
const resources = []
for (const pack of packs) {
  const words = pack.rows.trim().split('\n').map((line, index) => {
    const [word, cn, sentence, translation] = line.split('|')
    if (!word || !cn || !sentence || !translation) throw new Error('Invalid row: ' + line)
    return { id: `${pack.id}-${index + 1}`, word, phonetic0: '', phonetic1: '',
      langType: 'nl', trans: [{ pos: /^(de|het) /.test(word) ? '名词' : '', cn }],
      sentences: [{ c: sentence, cn: translation }], phrases: [], synos: [],
      relWords: { root: '', rels: [] }, etymology: [] }
  })
  all.push(...words)
  await writeJSON(`public/dicts/nl/word/${pack.id}.json`, words)
  const { rows, ...info } = pack
  resources.push({ ...info, name: pack.title, enName: pack.id, url: pack.id + '.json',
    length: words.length, category: '荷兰语入门', tags: [pack.level, '主题词汇'], language: 'nl',
    translateLanguage: 'zh-CN', version: 1, type: 'word', recommended: true })
}
await writeJSON('public/dicts/nl/word/all.json', all)
await writeJSON('app/data/dutch-curriculum.json', resources)
await writeJSON('public/list/word.json', resources)
await writeJSON('public/list/recommend_word.json', resources)
const articles = dialogues.map(({ lines, ...info }) => ({ ...info,
  text: lines.map(line => line[0]).join('\n\n'), textTranslate: lines.map(line => line[1]).join('\n\n'),
  audioSrc: '', audioFileId: '', lrcPosition: [], newWords: [], questions: [], nameList: [] }))
await writeJSON('public/dicts/nl/article/nl-dialogues.json', articles)
const books = [{ id: 'nl-dialogues', enName: 'nl-dialogues', name: '荷兰生活 · 八段日常对话',
  description: '原创入门对话，含逐句中文译文。可跟打、听写或默写；语音使用浏览器荷兰语 TTS。',
  url: 'nl-dialogues.json', length: articles.length, language: 'nl', translateLanguage: 'zh-CN',
  category: '荷兰语阅读', tags: ['A1–A2', '生活对话'], type: 'article', version: 1, recommended: true, cover: '' }]
await writeJSON('public/list/article.json', books)
await writeJSON('public/list/recommend_article.json', books)
console.log(`Generated ${all.length} Dutch words in ${packs.length} packs and ${articles.length} dialogues.`)
