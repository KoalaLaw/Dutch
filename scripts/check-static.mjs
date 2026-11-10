import { readFile, access, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const root = resolve('.output/public')
for (const path of ['index.html', 'dutch-icon.svg', 'list/word.json', 'list/article.json', 'dicts/nl/word/all.json', 'dicts/nl/article/nl-dialogues.json']) {
  await access(resolve(root, path))
}
const index = await readFile(resolve(root, 'index.html'), 'utf8')
if (!index.includes('_nuxt/')) throw new Error('Missing built application assets')
const words = JSON.parse(await readFile(resolve(root, 'dicts/nl/word/all.json'), 'utf8'))
if (words.length !== 180) throw new Error('Dutch content is incomplete')
await writeFile(resolve(root, '.nojekyll'), '')
console.log('Static output verified: application, Dutch dictionaries and dialogues present.')
