import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { packs as foundationPacks, dialogues } from '../content/dutch-course.mjs'
import { extraPacksA } from '../content/b1-vocabulary-a.mjs'
import { extraPacksB } from '../content/b1-vocabulary-b.mjs'
import { dailyPacksA } from '../content/daily-vocabulary-a.mjs'
import { dailyPacksB } from '../content/daily-vocabulary-b.mjs'
import { dailySkills } from '../content/daily-skills.mjs'
import { b1Readings } from '../content/b1-readings.mjs'
import { grammarUnits, writingTasks, speakingTasks } from '../content/b1-skills.mjs'

const writeJSON = async (file, data) => {
  const url = new URL('../' + file, import.meta.url)
  await mkdir(dirname(fileURLToPath(url)), { recursive: true })
  await writeFile(url, JSON.stringify(data, null, 2) + '\n')
}
const packs = [...foundationPacks, ...extraPacksA, ...extraPacksB, ...dailyPacksA, ...dailyPacksB]
const all = []
const resources = []
const seen = new Set()
for (const pack of packs) {
  const words = pack.rows.trim().split('\n').map((line, index) => {
    const [word, cn, sentence, translation, extra] = line.split('|')
    if (!word || !cn || !sentence || !translation || extra) throw new Error('Invalid row: ' + line)
    const normalized = word.normalize('NFC').toLocaleLowerCase('nl')
    if (seen.has(normalized)) throw new Error('Duplicate Dutch entry: ' + word)
    seen.add(normalized)
    return { id: pack.id + '-' + (index + 1), word, phonetic0: '', phonetic1: '',
      langType: 'nl', trans: [{ pos: /^(de|het) /.test(word) && word.split(' ').length === 2 ? '名词' : word.includes(' ') && !foundationPacks.includes(pack) ? '搭配' : '', cn }],
      sentences: [{ c: sentence, cn: translation }], phrases: [], synos: [],
      relWords: { root: '', rels: [] }, etymology: [] }
  })
  if (words.length !== 30) throw new Error(pack.id + ': expected 30 entries')
  all.push(...words)
  await writeJSON('public/dicts/nl/word/' + pack.id + '.json', words)
  const { rows, ...info } = pack
  const stage = pack.stage ?? (foundationPacks.includes(pack) ? 'foundation' : pack.level === 'B1' ? 'b1' : 'bridge')
  resources.push({ ...info, stage, name: pack.title, enName: pack.id, url: pack.id + '.json',
    length: words.length, category: stage === 'foundation' ? 'A1–A2 基础' : stage === 'bridge' ? 'A2 进阶' : 'B1 综合',
    tags: [pack.level, '主题词汇与搭配'], language: 'nl', translateLanguage: 'zh-CN',
    version: 1, type: 'word', recommended: true })
}
await writeJSON('public/dicts/nl/word/all.json', all)
await writeJSON('app/data/dutch-curriculum.json', resources)
await writeJSON('public/list/word.json', resources)
await writeJSON('public/list/recommend_word.json', resources.filter(pack => pack.stage !== 'foundation').slice(0, 9))
const articleDefaults = { audioSrc: '', audioFileId: '', lrcPosition: [], newWords: [], nameList: [] }
const articles = dialogues.map(({ lines, ...info }) => ({ ...info,
  text: lines.map(line => line[0]).join('\n\n'), textTranslate: lines.map(line => line[1]).join('\n\n'),
  ...articleDefaults, questions: [] }))
await writeJSON('public/dicts/nl/article/nl-dialogues.json', articles)
const advanced = b1Readings.map(({ paragraphs, ...info }) => ({ ...info,
  text: paragraphs.map(paragraph => paragraph.map(pair => pair[0]).join('\n')).join('\n\n'),
  textTranslate: paragraphs.map(paragraph => paragraph.map(pair => pair[1]).join('\n')).join('\n\n'),
  ...articleDefaults }))
await writeJSON('public/dicts/nl/article/nl-b1-reading.json', advanced)
await writeJSON('app/data/b1-readings.json', b1Readings)
await writeJSON('app/data/b1-skills.json', { grammarUnits, writingTasks, speakingTasks })
await writeJSON('app/data/daily-skills.json', dailySkills)
await writeJSON('app/data/daily-dialogues.json', dialogues)
const books = [
  { id: 'nl-dialogues', enName: 'nl-dialogues', name: '荷兰生活 · 八段日常对话',
    description: '原创入门双语对话，保留原有学习进度。', url: 'nl-dialogues.json', length: articles.length,
    tags: ['A1–A2', '生活对话'] },
  { id: 'nl-b1-reading', enName: 'nl-b1-reading', name: '走向 B1 · 生活与工作阅读',
    description: '12 篇原创 B1 训练阅读，每篇约 180–220 词，含逐句译文和 3 道阅读理解题。',
    url: 'nl-b1-reading.json', length: advanced.length, tags: ['B1', '阅读理解', '复述与表达'] },
].map(book => ({ ...book, language: 'nl', translateLanguage: 'zh-CN', category: '荷兰语阅读',
  type: 'article', version: 1, recommended: true, cover: '' }))
await writeJSON('public/list/article.json', books)
await writeJSON('public/list/recommend_article.json', [books[1], books[0]])
const summary = { wordCount: all.length, packCount: packs.length, foundationCount: resources.filter(pack=>pack.stage==='foundation').length * 30,
  starterCount: foundationPacks.length * 30, dailySkillCount: dailySkills.length, routeDayCount:252, routeWeekCount:36,
  progressionCount: resources.filter(pack=>pack.stage!=='foundation').length * 30, dialogueCount: articles.length,
  readingCount: advanced.length, readingQuestionCount: b1Readings.reduce((n, r) => n + r.questions.length, 0),
  grammarCount: grammarUnits.length, grammarExerciseCount: grammarUnits.reduce((n, unit) => n + unit.exercises.length, 0),
  writingCount: writingTasks.length, speakingCount: speakingTasks.length }
await writeJSON('app/data/course-summary.json', summary)
await writeJSON('public/course-summary.json', summary)
console.log(JSON.stringify(summary))

await import('./generate-daily-plan.mjs')
