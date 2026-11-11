import { readFile, access, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const root = resolve('.output/public')
for (const path of ['index.html', 'dutch-icon.svg', 'list/word.json', 'list/article.json', 'dicts/nl/word/all.json', 'dicts/nl/article/nl-dialogues.json', 'dicts/nl/article/nl-b1-reading.json', 'course-summary.json']) {
  await access(resolve(root, path))
}
const index = await readFile(resolve(root, 'index.html'), 'utf8')
if (!index.includes('_nuxt/')) throw new Error('Missing built application assets')
const words = JSON.parse(await readFile(resolve(root, 'dicts/nl/word/all.json'), 'utf8'))
const audio = JSON.parse(await readFile('app/data/dutch-audio.json', 'utf8'))
await Promise.all(Object.values(audio).map(path => access(resolve(root, '.' + path))))
const summary = JSON.parse(await readFile(resolve(root, 'course-summary.json'), 'utf8'))
if (words.length !== summary.wordCount || summary.progressionCount < 900) throw new Error('Dutch content is incomplete')
const plan = JSON.parse(await readFile('app/data/daily-plan.json', 'utf8'))
const plannedIds = plan.days.flatMap(day => day.wordIds)
if (plan.days.length !== summary.routeDayCount || plan.weeks.length !== summary.routeWeekCount || new Set(plannedIds).size !== words.length || plannedIds.some(id => !words.some(word => word.id === id))) throw new Error('The daily route does not cover the published dictionary')
const books = JSON.parse(await readFile(resolve(root, 'list/article.json'), 'utf8'))
for (const book of books) {
  const items = JSON.parse(await readFile(resolve(root, 'dicts/nl/article', book.url), 'utf8'))
  if (items.length !== book.length) throw new Error('Incomplete reading book: ' + book.id)
}
await writeFile(resolve(root, '.nojekyll'), '')
console.log('Static output verified: application, Dutch dictionaries, readings and ' + Object.keys(audio).length + ' Dutch audio clips present.')
