// Static Dutch audio corpus builder. The Edge companion generates the MP3 files.
// Build-time dependencies/intermediate data stay in ignored .cache/dutch-audio.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tokenizeDutchSentence } from '../app/core/utils/dutch-tokenizer.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const jobs = new Map()
const tokens = new Set()
const voiceVersion = 'edge-tts|nl-NL-FennaNeural|rate+0%|mp3-v1'
export function normalizeAudioText(value) {
  return String(value).normalize('NFC').replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"').replace(/\s+/g, ' ').trim().toLocaleLowerCase('nl')
}
function add(text, priority, category) {
  if (typeof text !== 'string' || !text.trim()) return
  const key = normalizeAudioText(text)
  if (!key || !/[\p{L}\p{N}]/u.test(key)) return
  const existing = jobs.get(key)
  if (!existing || existing.priority > priority) {
    const filename = createHash('sha256').update(voiceVersion + '|' + key).digest('hex').slice(0, 24) + '.mp3'
    jobs.set(key, { key, text: text.normalize('NFC').replace(/[‘’‚‛]/g, "'").replace(/[“”„‟]/g, '"').replace(/\s+/g, ' ').trim(), priority, category, filename })
  }
  for (const token of tokenizeDutchSentence(text)) {
    if (token.kind === 'word') tokens.add(token.word)
  }
}
async function json(file) { return JSON.parse(await readFile(resolve(root, file), 'utf8')) }
function addSentences(text, priority, category) {
  add(text, priority, category)
  for (const paragraph of text.split(/\n\s*\n/).filter(Boolean)) add(paragraph, priority, category)
  for (const line of text.split('\n').filter(Boolean)) add(line.trim(), priority, category)
}

const words = await json('public/dicts/nl/word/all.json')
for (const word of words) add(word.word, 1, 'headword')
for (const word of words) {
  for (const sentence of word.sentences ?? []) add(sentence.c, 3, 'word-example')
  for (const phrase of word.phrases ?? []) add(phrase.c, 3, 'word-phrase')
}
const books = await json('public/list/article.json')
for (const book of books) {
  const articles = await json(`public/dicts/nl/article/${book.url}`)
  for (const article of articles) {
    add(article.title, 4, 'article-title')
    // Native article practice speaks each newline sentence; B1 pages speak each paragraph.
    for (const paragraph of article.text.split(/\n\s*\n/)) {
      add(paragraph.split('\n').map(value => value.trim()).join(' '), 4, 'article-paragraph')
      for (const line of paragraph.split('\n')) add(line.trim(), 4, 'article-sentence')
    }
  }
}
const readings = await json('app/data/b1-readings.json')
for (const reading of readings) {
  add(reading.title, 4, 'reading-title')
  for (const paragraph of reading.paragraphs) {
    add(paragraph.map(pair => pair[0]).join(' '), 4, 'reading-paragraph')
    for (const pair of paragraph) add(pair[0], 4, 'reading-sentence')
  }
}
const skills = await json('app/data/b1-skills.json')
for (const unit of skills.grammarUnits) {
  for (const example of unit.examples) add(example.nl, 2, 'grammar-example')
}
for (const task of skills.writingTasks) {
  addSentences(task.model, 5, 'writing-model')
  add(task.scenario, 5, 'writing-scenario')
}
for (const task of skills.speakingTasks) {
  addSentences(task.model, 5, 'speaking-model')
  add(task.scenario, 5, 'speaking-scenario')
  for (const phrase of task.phrases) add(phrase.nl, 2, 'speaking-phrase')
}
for (const sourcePath of ['app/components/DutchHome.vue', 'app/components/DutchGuide.vue', 'app/components/setting/SoundSetting.vue']) {
  const source = await readFile(resolve(root, sourcePath), 'utf8')
  for (const match of source.matchAll(/(?:word|sentence|example)\s*:\s*(['"])((?:\\.|(?!\1).)*)\1/g)) {
    add(match[2].replace(/\\(['"])/g, '$1'), 0, 'demo')
  }
  for (const match of source.matchAll(/(?:speak|play)\(\s*(['"])((?:\\.|(?!\1).)*)\1/g)) {
    add(match[2].replace(/\\(['"])/g, '$1'), 0, 'demo')
  }
  for (const match of source.matchAll(/const exampleText\s*=\s*(['"])((?:\\.|(?!\1).)*)\1/g)) {
    add(match[2].replace(/\\(['"])/g, '$1'), 0, 'settings-preview')
  }
}
// Stable test samples and accent-bearing Dutch forms useful for input guidance.
for (const sample of ['hallo', 'goedemorgen', 'de fiets', 'de verantwoordelijkheid', 'volgens mij', 'één', 'tweeën', 'ideeën', 'café', 'Hallo! Ik leer Nederlands. Hoe gaat het met je?']) add(sample, 0, 'sample')
for (const token of [...tokens]) add(token, 6, 'clicked-word')
const output = [...jobs.values()].sort((a, b) => a.priority - b.priority || a.key.localeCompare(b.key, 'nl'))
const cache = resolve(root, '.cache/dutch-audio')
await mkdir(cache, { recursive: true })
await writeFile(resolve(cache, 'jobs.json'), JSON.stringify(output, null, 2) + '\n')
const manifestPath = resolve(root, 'app/data/dutch-audio.json')
const expectedManifest = Object.fromEntries([...output].sort((a,b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0).map(job => [job.key, '/audio/nl/' + job.filename]))
const manifestText = JSON.stringify(expectedManifest, null, 2) + '\n'
if (await readFile(manifestPath, 'utf8').catch(() => '') !== manifestText) await writeFile(manifestPath, manifestText)
await writeFile(resolve(root, 'app/data/dutch-audio-source.json'), JSON.stringify({provider:'Microsoft Edge', voice:'nl-NL-FennaNeural', locale:'nl-NL', label:'Fenna · 荷兰语（荷兰）'}, null, 2) + '\n')
const categories = {}
for (const job of output) categories[job.category] = (categories[job.category] ?? 0) + 1
console.log(JSON.stringify({ jobs: output.length, categories, output: '.cache/dutch-audio/jobs.json', voiceVersion }))
