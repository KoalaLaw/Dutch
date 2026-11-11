import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { packs, dialogues } from '../content/dutch-course.mjs'
import { extraPacksA } from '../content/b1-vocabulary-a.mjs'
import { extraPacksB } from '../content/b1-vocabulary-b.mjs'
import { dailyPacksA } from '../content/daily-vocabulary-a.mjs'
import { dailyPacksB } from '../content/daily-vocabulary-b.mjs'
import { dailySkills } from '../content/daily-skills.mjs'
import { parseDailyState, emptyDailyState, emptyDailyDay, isDailyComplete, recommendedDay, localStudyDate } from '../app/core/utils/daily-learning.ts'
import { b1Readings } from '../content/b1-readings.mjs'
import { grammarUnits, writingTasks, speakingTasks } from '../content/b1-skills.mjs'
import { parseB1State, countDutchWords, isWritingReady, emptyB1State } from '../app/core/utils/b1-learning.ts'
import { withAppBaseURL } from '../app/core/utils/base-url.ts'
import { selectDutchVoice, normalizeDutchInput, isDutchPrintableKey } from '../app/core/utils/dutch.ts'
import { tokenizeDutchSentence } from '../app/core/utils/dutch-tokenizer.ts'
import { dutchHeadword, dutchDictionaryURL, dutchTranslationURL, dutchDictionaryLinks } from '../app/core/utils/dutch-dictionary.ts'
import { createDutchAudioPlayer, normalizeDutchAudioText } from '../app/core/utils/dutch-audio.ts'
import { isWholePracticeInputCorrect } from '../app/core/composables/practice-words/visible-word-typing.ts'
import { getDutchGrammar } from '../app/core/utils/dutch-grammar.ts'

const json = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'))

test('dictionary links explicitly use Dutch, preserve accents and safely encode phrases', () => {
  assert.equal(dutchHeadword('  De verantwoordelijkheid! '), 'verantwoordelijkheid')
  assert.equal(dutchHeadword('het eens zijn'), 'het eens zijn')
  assert.equal(dutchHeadword('cafe\u0301'), 'café')
  assert.equal(dutchDictionaryURL('de bank'), 'https://www.woorden.org/woord/bank')
  const translation = new URL(dutchTranslationURL('bank & werk?'))
  assert.equal(translation.searchParams.get('sl'), 'nl')
  assert.equal(translation.searchParams.get('tl'), 'zh-CN')
  assert.equal(translation.searchParams.get('text'), 'bank & werk?')
  const links = dutchDictionaryLinks('café')
  assert.equal(new URL(links[2].href).hostname, 'nl.wiktionary.org')
  assert.equal(new URL(links[2].href).hash, '#Nederlands')
})

function audioFixture({ speech, reject = false, sources = { hallo: '/Dutch/audio/nl/hallo.mp3' } } = {}) {
  const events = []
  const audio = {
    src: '', volume: 0, playbackRate: 0, currentTime: 0,
    pause() { events.push('pause') },
    play() { events.push('play'); return reject ? Promise.reject(Error('media failed')) : Promise.resolve() },
  }
  const player = createDutchAudioPlayer({
    source: text => sources[normalizeDutchAudioText(text)], createAudio: () => audio,
    speech, createUtterance: text => ({ text }), onError: () => events.push('error'),
  })
  return { player, audio, events }
}

test('built-in Dutch audio plays immediately without system voices, with volume/speed and real playback callbacks', () => {
  const { player, audio, events } = audioFixture()
  player.play('Hallo', { volume: .4, rate: .75, onPlay: () => events.push('started'), onEnd: () => events.push('ended') })
  assert.equal(audio.src, '/Dutch/audio/nl/hallo.mp3')
  assert.equal(audio.volume, .4)
  assert.equal(audio.playbackRate, .75)
  assert.deepEqual(events, ['play'])
  audio.onplaying()
  audio.onended()
  audio.onended()
  assert.deepEqual(events, ['play', 'started', 'ended'])
  assert.equal(normalizeDutchAudioText('  “CAFE\u0301”\n en ’s morgens '), '"café" en \'s morgens')
})

test('replacing or stopping a clip suppresses stale end/error callbacks', () => {
  const { player, audio, events } = audioFixture()
  player.play('hallo', { onEnd: () => events.push('old-ended') })
  const oldEnd = audio.onended
  const oldError = audio.onerror
  player.play('hallo', { onEnd: () => events.push('new-ended') })
  oldEnd()
  oldError()
  assert.ok(!events.includes('old-ended'))
  assert.ok(!events.includes('error'))
  const newEnd = audio.onended
  player.stop()
  newEnd()
  assert.ok(!events.includes('new-ended'))
  assert.equal(audio.currentTime, 0)
})

test('failed media can use a Dutch voice and resumes a previously paused synthesizer', async () => {
  const spoken = []
  const speech = {
    paused: true,
    cancel() {}, resume() { this.paused = false },
    getVoices: () => [{ name: 'English', lang: 'en-US' }, { name: 'Dutch', lang: 'nl-NL' }],
    speak(utterance) { assert.equal(this.paused, false); spoken.push(utterance) },
  }
  const { player, events } = audioFixture({ speech, reject: true })
  player.play('hallo', { onEnd: () => events.push('ended') })
  await Promise.resolve()
  assert.equal(spoken.length, 1)
  assert.equal(spoken[0].lang, 'nl-NL')
  assert.equal(spoken[0].voice.name, 'Dutch')
  spoken[0].onend()
  assert.ok(events.includes('ended'))
})

test('missing custom-text Dutch voice gives a visible failure and never uses English', () => {
  const speech = { cancel() {}, getVoices: () => [{ name: 'English', lang: 'en-US' }], speak() { assert.fail('English voice must not be used') } }
  const { player, events } = audioFixture({ speech })
  player.play('custom text', { onEnd: () => events.push('ended') })
  assert.deepEqual(events, ['error', 'ended'])
})

test('stopping while system voices load removes the listener and suppresses delayed playback', () => {
  let pending
  const listeners = new Set()
  const speech = {
    cancel() {}, getVoices: () => [],
    addEventListener(event, listener) { pending = listener; listeners.add(listener) },
    removeEventListener(event, listener) { listeners.delete(listener) },
    speak() { assert.fail('Cancelled text must not play') },
  }
  const { player, events } = audioFixture({ speech })
  player.play('custom text', { onEnd: () => events.push('ended') })
  assert.equal(listeners.size, 1)
  player.stop()
  assert.equal(listeners.size, 0)
  pending()
  assert.deepEqual(events, [])
})

test('built-in Dutch texts and clickable words have complete, nonempty MP3 assets', async () => {
  const source = await json('app/data/dutch-audio-source.json')
  assert.equal(source.locale, 'nl-NL', 'Course recordings must use Netherlands Dutch')
  assert.ok(source.voice.startsWith(source.locale + '-'), 'Voice and source language must agree')
  const manifest = await json('app/data/dutch-audio.json')
  const expected = ['Hallo! Ik leer Nederlands. Hoe gaat het met je?']
  const words = await json('public/dicts/nl/word/all.json')
  for (const word of words) expected.push(word.word, ...word.sentences.map(item => item.c))
  for (const reading of b1Readings) {
    for (const paragraph of reading.paragraphs) expected.push(paragraph.map(pair => pair[0]).join(' '), ...paragraph.map(pair => pair[0]))
  }
  for (const unit of grammarUnits) expected.push(...unit.examples.map(item => item.nl))
  for (const unit of dailySkills) expected.push(...unit.examples.map(item => item.nl))
  for (const task of [...writingTasks, ...speakingTasks]) expected.push(task.model)
  for (const task of speakingTasks) expected.push(...task.phrases.map(item => item.nl))
  for (const book of await json('public/list/article.json')) {
    for (const article of await json(`public/dicts/nl/article/${book.url}`)) expected.push(...article.text.split('\n').filter(Boolean))
  }
  for (const text of expected) {
    assert.ok(manifest[normalizeDutchAudioText(text)], `Missing audio: ${text}`)
    for (const token of tokenizeDutchSentence(text)) {
      if (token.kind === 'word') assert.ok(manifest[normalizeDutchAudioText(token.word)], `Missing clicked-word audio: ${token.word}`)
    }
  }
  assert.ok(Object.keys(manifest).length >= 4500)
  const entries = Object.entries(manifest)
  for (let offset = 0; offset < entries.length; offset += 64) {
    await Promise.all(entries.slice(offset, offset + 64).map(async ([key, path]) => {
      assert.equal(key, normalizeDutchAudioText(key))
      assert.match(path, /^\/audio\/nl\/[a-f\d]{24}\.mp3$/)
      const bytes = await readFile(new URL('../public' + path, import.meta.url))
      assert.ok(bytes.length > 200, `Empty clip: ${key}`)
      assert.equal(bytes[0], 0xff, `Invalid MP3: ${key}`)
      assert.equal(bytes[1] & 0xe0, 0xe0, `Invalid MP3 frame: ${key}`)
    }))
  }
})
test('every visible course loads a complete Dutch word dictionary with Chinese examples', async () => {
  const resources = await json('public/list/word.json')
  assert.equal(resources.length, 72)
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
      if (word.trans[0].pos === '名词' && !getDutchGrammar(word)?.bare) assert.match(word.word, /^(de|het) /)
    }
  }
  assert.equal(total, 2160)
  const combined = await json('public/dicts/nl/word/all.json')
  assert.equal(combined.length, total)
  assert.deepEqual(new Set(combined.map(word => word.id)), ids)
  assert.equal(packs.length + extraPacksA.length + extraPacksB.length + dailyPacksA.length + dailyPacksB.length, resources.length)
  assert.equal(resources.filter(item=>item.stage !== 'foundation').reduce((n,item)=>n+item.length,0),1620)
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
  assert.equal(summary.wordCount,2160)
  assert.equal(summary.packCount,72)
  assert.equal(summary.progressionCount,1620)
  assert.equal(summary.grammarExerciseCount,48)
  assert.equal(summary.readingQuestionCount,36)
  assert.equal(summary.writingCount,12)
  assert.equal(summary.speakingCount,12)
  assert.equal(books.length,2)
  assert.equal(books[0].id,'nl-dialogues')
  assert.equal(books[1].id,'nl-b1-reading')
})


test('daily route covers all 2160 stable word IDs exactly once in 216 short lessons and 36 review days', async () => {
 const plan=await json('app/data/daily-plan.json');const words=await json('public/dicts/nl/word/all.json');const packs=await json('app/data/dutch-curriculum.json');
 assert.equal(plan.days.length,252);assert.equal(plan.weeks.length,36);assert.equal(plan.days.filter(day=>day.review).length,36);
 const planned=plan.days.flatMap(day=>day.wordIds);assert.equal(planned.length,2160);assert.equal(new Set(planned).size,2160);assert.deepEqual(new Set(planned),new Set(words.map(word=>word.id)));
 for(const [index,day] of plan.days.entries()){assert.equal(day.number,index+1);assert.equal(day.week,Math.floor(index/7)+1);assert.equal(day.weekday,index%7+1);assert.equal(day.review,day.weekday===7);assert.equal(day.wordIds.length,day.review?0:10);assert.ok(day.minutes<=30);if(!day.review){assert.ok(packs.some(pack=>pack.id===day.packId));assert.ok(day.wordIds.every(id=>id.startsWith(day.packId+'-')))}}
 for(const week of plan.weeks){assert.equal(week.dayIds.length,7);assert.equal(week.packIds.length,2);for(const packId of week.packIds){const lessons=plan.days.filter(day=>day.week===week.number&&day.packId===packId);assert.equal(lessons.length,3);assert.deepEqual(lessons.map(day=>day.offset),[0,10,20])}}
 assert.deepEqual(plan.phases.map(phase=>phase.packCount),[18,24,30]);assert.deepEqual(plan.phases.map(phase=>phase.wordCount),[540,720,900]);assert.deepEqual(plan.phases.map(phase=>[phase.firstDay,phase.lastDay]),[[1,63],[64,147],[148,252]]);
})

test('every daily skill link resolves and B1 writing is split into outline, draft and revision', async () => {
 const plan=await json('app/data/daily-plan.json');const dialogs=await json('app/data/daily-dialogues.json');
 const sets={micro:new Set(dailySkills.map(item=>item.id)),grammar:new Set(grammarUnits.map(item=>item.id)),reading:new Set(b1Readings.map(item=>item.id)),writing:new Set(writingTasks.map(item=>item.id)),speaking:new Set(speakingTasks.map(item=>item.id)),dialogue:new Set(dialogs.map(item=>item.id))};
 for(const day of plan.days){assert.ok(sets[day.skill.kind]?.has(day.skill.id),day.id+' skill must resolve');if(day.stage==='foundation')assert.ok(['micro','dialogue'].includes(day.skill.kind));}
 for(const task of writingTasks){const steps=new Set(plan.days.filter(day=>day.skill.kind==='writing'&&day.skill.id===task.id).map(day=>day.skill.step));assert.ok(['outline','draft','revise'].every(step=>steps.has(step)))}
 assert.deepEqual(new Set(plan.days.filter(day=>day.skill.kind==='grammar').map(day=>day.skill.id)),sets.grammar);assert.deepEqual(new Set(plan.days.filter(day=>day.skill.kind==='reading').map(day=>day.skill.id)),sets.reading);
})

test('micro lessons add real beginner and bridge practice with unambiguous data and valid exercises',()=>{
 assert.equal(dailySkills.length,48);assert.equal(new Set(dailySkills.map(item=>item.id)).size,48);
 for(const stage of ['foundation','bridge'])assert.equal(dailySkills.filter(item=>item.stage===stage).length,24);
 for(const lesson of dailySkills){assert.ok(lesson.title&&lesson.explanation&&lesson.prompt);assert.equal(lesson.examples.length,2);for(const example of lesson.examples){assert.ok(example.nl&&example.zh);assert.ok(countDutchWords(example.nl)<=45)}const q=lesson.exercise;assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);assert.ok(q.explanation)}
})

test('daily state restores incomplete typing, review errors, drafts and weekly checks without declaring unseen days complete',async()=>{
 const plan=await json('app/data/daily-plan.json');const state=emptyDailyState();const day=emptyDailyDay();state.days.d001=day;day.done=['review'];day.production='Ik ben thuis.';day.sessions.vocabulary={ids:plan.days[0].wordIds,index:3,round:'recall',missed:[plan.days[0].wordIds[1]],correct:2,input:'goede'};state.words[plan.days[0].wordIds[0]]={text:'hallo',lastDate:'2026-11-11',due:'2026-11-12T08:00:00.000Z',attempts:1,misses:0};state.writingNotes['b1-w01']='eerste regel\ntweede regel\nderde regel';
 assert.deepEqual(parseDailyState(JSON.stringify(state)),state);assert.equal(isDailyComplete(plan.days[0],state),false);assert.equal(recommendedDay(plan.days,state).id,'d001');day.done=['review','vocabulary','skill'];assert.equal(isDailyComplete(plan.days[0],state),true);assert.equal(recommendedDay(plan.days,state).id,'d002');state.startDay=148;assert.equal(recommendedDay(plan.days,state).id,'d148');assert.equal(isDailyComplete(plan.days[1],state),false);assert.deepEqual(parseDailyState('{broken'),emptyDailyState());assert.equal(localStudyDate(new Date(2026,10,11,23,59)),'2026-11-11');
})

test('all original 1080 word IDs, meanings and example sentences survive the daily redistribution',async()=>{
 const words=await json('public/dicts/nl/word/all.json');const byId=new Map(words.map(word=>[word.id,word]));let checked=0
 for(const pack of [...packs,...extraPacksA,...extraPacksB]){
  for(const [index,row] of pack.rows.trim().split('\n').entries()){
   const [word,cn,example,translation]=row.split('|');const current=byId.get(pack.id+'-'+(index+1));assert.ok(current)
   assert.equal(current.word,word);assert.equal(current.trans[0].cn,cn);assert.deepEqual(current.sentences[0],{c:example,cn:translation});checked++
  }
 }
 assert.equal(checked,1080)
})

test('a weekly review remains unfinished when a retry falls below the recall target',async()=>{
 const plan=await json('app/data/daily-plan.json');const state=emptyDailyState();const week=plan.days[6]
 state.days[week.id]=emptyDailyDay();state.days[week.id].done=['review','skill','check']
 state.days[week.id].scores.review=.8;assert.equal(isDailyComplete(week,state),true)
 state.days[week.id].scores.review=.7;assert.equal(isDailyComplete(week,state),false)
})
