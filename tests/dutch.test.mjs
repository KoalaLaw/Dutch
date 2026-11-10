import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { packs, dialogues } from '../content/dutch-course.mjs'
import { extraPacksA } from '../content/b1-vocabulary-a.mjs'
import { extraPacksB } from '../content/b1-vocabulary-b.mjs'
import { b1Readings } from '../content/b1-readings.mjs'
import { grammarUnits, writingTasks, speakingTasks } from '../content/b1-skills.mjs'
import { parseB1State, countDutchWords, isWritingReady, emptyB1State } from '../app/core/utils/b1-learning.ts'
import { withAppBaseURL } from '../app/core/utils/base-url.ts'
import { selectDutchVoice, normalizeDutchInput, isDutchPrintableKey } from '../app/core/utils/dutch.ts'
import { tokenizeDutchSentence } from '../app/core/utils/dutch-tokenizer.ts'
import { isWholePracticeInputCorrect } from '../app/core/composables/practice-words/visible-word-typing.ts'

const json = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'))
test('every visible course loads a complete Dutch word dictionary with Chinese examples', async () => {
  const resources = await json('public/list/word.json')
  assert.equal(resources.length, 36)
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
      const spelling = word.word.normalize('NFC').toLocaleLowerCase('nl')
      assert.ok(!spellings.has(spelling), 'Duplicate word: ' + word.word)
      ids.add(word.id); spellings.add(spelling)
      assert.ok(word.trans[0].cn)
      assert.ok(word.sentences[0].c)
      assert.ok(word.sentences[0].cn)
      assert.equal(word.langType, 'nl')
      if (word.trans[0].pos === '名词') assert.match(word.word, /^(de|het) /)
    }
  }
  assert.equal(total, 1080)
  const combined = await json('public/dicts/nl/word/all.json')
  assert.equal(combined.length, total)
  assert.deepEqual(new Set(combined.map(word => word.id)), ids)
  assert.equal(packs.length + extraPacksA.length + extraPacksB.length, resources.length)
  assert.equal(resources.filter(item=>item.stage !== 'foundation').reduce((n,item)=>n+item.length,0),900)
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

test('foundation dictionary IDs and word order remain stable for existing learners', async () => {
  for (const pack of packs) {
    const actual = await json(`public/dicts/nl/word/${pack.id}.json`)
    const original = pack.rows.trim().split('\n').map(row => row.split('|')[0])
    assert.deepEqual(actual.map(word=>word.word),original)
    assert.deepEqual(actual.map(word=>word.id),original.map((_,index)=>`${pack.id}-${index+1}`))
  }
})

test('B1 reading includes substantive paired texts and answerable question schemas', async () => {
  const actual = await json('public/dicts/nl/article/nl-b1-reading.json')
  assert.equal(b1Readings.length,12)
  assert.equal(actual.length,12)
  assert.equal(new Set(actual.map(item=>item.id)).size,12)
  for (const [index,item] of actual.entries()) {
    assert.equal(item.id,b1Readings[index].id)
    assert.ok(countDutchWords(item.text) >= 150,item.title)
    assert.ok(countDutchWords(item.text) <= 230,item.title)
    const nl = item.text.split('\n\n').map(paragraph=>paragraph.split('\n'))
    const zh = item.textTranslate.split('\n\n').map(paragraph=>paragraph.split('\n'))
    assert.ok(nl.length>=4)
    assert.deepEqual(nl.map(p=>p.length),zh.map(p=>p.length))
    assert.equal(item.questions.length,3)
    for (const q of item.questions) {
      assert.equal(q.options.length,4)
      assert.equal(new Set(q.options).size,4)
      assert.equal(q.correctAnswer.length,1)
      assert.match(q.correctAnswer[0],/^[a-d]$/)
      assert.ok(q.explanation && q.stem)
    }
  }
})

test('B1 grammar provides complete exercises with valid answer keys', () => {
  assert.equal(grammarUnits.length,16)
  assert.equal(new Set(grammarUnits.map(item=>item.id)).size,16)
  for (const unit of grammarUnits) {
    assert.ok(unit.explanation && unit.pattern && unit.title)
    assert.equal(unit.examples.length,3)
    assert.equal(unit.exercises.length,3)
    for (const q of unit.exercises) {
      assert.ok(q.options.length>=3)
      assert.equal(new Set(q.options).size,q.options.length)
      assert.ok(Number.isInteger(q.answer) && q.answer>=0 && q.answer<q.options.length)
      assert.ok(q.explanation && q.question)
    }
  }
})

test('B1 writing and speaking tasks include useful models, translations and self-checks', () => {
  assert.equal(writingTasks.length,12)
  assert.equal(speakingTasks.length,12)
  for (const task of writingTasks) {
    assert.ok(countDutchWords(task.model)>=task.minWords,task.id)
    assert.ok(countDutchWords(task.model)<=task.maxWords,task.id)
    assert.equal(task.requirements.length,3)
    assert.equal(task.checklist.length,4)
    assert.ok(task.modelTranslation && task.scenario && task.prompt)
  }
  for (const task of speakingTasks) {
    assert.ok(countDutchWords(task.model)>=60 && countDutchWords(task.model)<=100,task.id)
    assert.equal(task.prepSeconds,30)
    assert.equal(task.speakSeconds,90)
    assert.equal(task.phrases.length,3)
    assert.equal(task.prompts.length,3)
    assert.equal(task.checklist.length,4)
    assert.ok(task.modelTranslation && task.scenario)
  }
})

test('B1 self-review respects word limits and all checks, and restores saved drafts', () => {
  assert.equal(countDutchWords("Één café heeft twee ideeën. Collega’s praten over zee-egels."),9)
  const text = Array(100).fill('voorbeeld').join(' ')
  assert.ok(isWritingReady(text,[0,1,2,3],100,150,4))
  assert.ok(!isWritingReady(text,[0,1,1,2],100,150,4))
  assert.ok(!isWritingReady('te kort',[0,1,2,3],100,150,4))
  assert.ok(!isWritingReady(Array(151).fill('woord').join(' '),[0,1,2,3],100,150,4))
  const state=emptyB1State()
  state.drafts['b1-w01']=text
  state.answers['g:b1-g01:0']=1
  state.checks['b1-w01']=[0,1,2,3]
  state.completed['b1-w01']=true
  assert.deepEqual(parseB1State(JSON.stringify(state)),state)
  assert.deepEqual(parseB1State('invalid JSON'),emptyB1State())
})

test('generated summary and advanced book catalog agree with actual content', async () => {
  const summary=await json('app/data/course-summary.json')
  const books=await json('public/list/article.json')
  assert.equal(summary.wordCount,1080)
  assert.equal(summary.packCount,36)
  assert.equal(summary.progressionCount,900)
  assert.equal(summary.grammarExerciseCount,48)
  assert.equal(summary.readingQuestionCount,36)
  assert.equal(summary.writingCount,12)
  assert.equal(summary.speakingCount,12)
  assert.equal(books.length,2)
  assert.equal(books[0].id,'nl-dialogues')
  assert.equal(books[1].id,'nl-b1-reading')
})
