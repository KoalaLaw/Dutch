import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { packs, dialogues } from '../content/dutch-course.mjs'
import { withAppBaseURL } from '../app/core/utils/base-url.ts'
import { selectDutchVoice, normalizeDutchInput, isDutchPrintableKey } from '../app/core/utils/dutch.ts'
import { tokenizeDutchSentence } from '../app/core/utils/dutch-tokenizer.ts'
import { isWholePracticeInputCorrect } from '../app/core/composables/practice-words/visible-word-typing.ts'

const json = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'))
test('every visible course loads a complete Dutch word dictionary with Chinese examples', async () => {
  const resources = await json('public/list/word.json')
  assert.equal(resources.length, 6)
  let total = 0
  const ids = new Set()
  const spellings = new Set()
  for (const resource of resources) {
    assert.equal(resource.language, 'nl')
    assert.equal(resource.translateLanguage, 'zh-CN')
    const words = await json(`public/dicts/${resource.language}/word/${resource.url}`)
    assert.equal(words.length, resource.length)
    assert.equal(words.length, 30)
    total += words.length
    for (const word of words) {
      assert.ok(!ids.has(word.id), 'Duplicate word id: ' + word.id)
      assert.ok(!spellings.has(word.word), 'Duplicate word: ' + word.word)
      ids.add(word.id); spellings.add(word.word)
      assert.ok(word.trans[0].cn)
      assert.ok(word.sentences[0].c)
      assert.ok(word.sentences[0].cn)
      assert.equal(word.langType, 'nl')
      if (word.trans[0].pos === '名词') assert.match(word.word, /^(de|het) /)
    }
  }
  assert.equal(total, 180)
  const combined = await json('public/dicts/nl/word/all.json')
  assert.equal(combined.length, total)
  assert.deepEqual(new Set(combined.map(word => word.id)), ids)
  assert.equal(packs.length, resources.length)
})

test('dialogue resources pair every Dutch sentence with its Chinese translation', async () => {
  const resources = await json('public/list/article.json')
  const articles = await json(`public/dicts/${resources[0].language}/article/${resources[0].url}`)
  assert.equal(articles.length, 8)
  assert.equal(dialogues.length, articles.length)
  for (const article of articles) {
    const lines = article.text.split('\n\n')
    assert.equal(lines.length, article.textTranslate.split('\n\n').length)
    assert.ok(lines.length >= 6)
    assert.equal(article.audioSrc, '') // Dutch browser TTS, no English recording.
  }
})

test('Dutch speech selection uses only Dutch voices with region and saved preferences', () => {
  const voices = [{ name:'English',lang:'en-US' },{ name:'Dutch Belgium',lang:'nl-BE' },{ name:'Dutch Netherlands',lang:'nl-NL' }]
  assert.equal(selectDutchVoice(voices)?.name, 'Dutch Netherlands')
  assert.equal(selectDutchVoice(voices, undefined, 'nl-BE')?.name, 'Dutch Belgium')
  assert.equal(selectDutchVoice(voices, 'Dutch Belgium')?.name, 'Dutch Belgium')
  assert.equal(selectDutchVoice(voices, 'English')?.name, 'Dutch Netherlands')
  assert.equal(selectDutchVoice([voices[0]]), undefined)
  assert.equal(selectDutchVoice([]), undefined)
})

test('Dutch accented words, hyphens, apostrophes and decimal commas stay intact', () => {
  const tokens = tokenizeDutchSentence('Eén café, tweeën en ideeën. Collega’s betalen €2,50.')
  assert.deepEqual(tokens.filter(token => token.kind === 'word').map(token => token.word), ['Eén','café','tweeën','en','ideeën',"Collega's",'betalen'])
  assert.ok(tokens.some(token => token.word === '€2,50' && token.kind === 'number'))
  assert.equal(tokenizeDutchSentence('zee-egel')[0].word, 'zee-egel')
  assert.equal(tokenizeDutchSentence('cafe\u0301')[0].word, 'café')
  const phrase = tokenizeDutchSentence('de fiets!')
  assert.deepEqual(phrase.map(token => [token.word,token.nextSpace]), [['de',true],['fiets',false],['!',false]])
})

test('typing keeps accents significant and accepts noun articles with spaces', () => {
  assert.ok(isWholePracticeInputCorrect('de fiets','de fiets',true))
  assert.ok(isWholePracticeInputCorrect('ÉÉN','één',true))
  assert.ok(!isWholePracticeInputCorrect('een','één',true))
  assert.ok(!isWholePracticeInputCorrect('fiets','de fiets',true))
  assert.ok(!isWholePracticeInputCorrect('de fiets','het fiets',true))
  assert.equal(normalizeDutchInput('  CAFE\u0301  '), 'café')
})

test('public assets respect GitHub Pages project subdirectories', async () => {
  assert.equal(withAppBaseURL('/dicts/nl/word/all.json','/Dutch/'),'/Dutch/dicts/nl/word/all.json')
  assert.equal(withAppBaseURL('/Dutch/dicts/nl/word/all.json','/Dutch/'),'/Dutch/dicts/nl/word/all.json')
  assert.equal(withAppBaseURL('https://example.com/voice','/Dutch/'),'https://example.com/voice')
})

test('keyboard routing accepts Dutch accented letters, not modifier keys', () => {
  for (const key of ['a','é','ë','ï','É']) assert.ok(isDutchPrintableKey(key))
  for (const key of ['Dead','Enter','Shift','ArrowLeft']) assert.ok(!isDutchPrintableKey(key))
})
