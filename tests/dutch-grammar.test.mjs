import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {annotateWord} from '../content/dutch-grammar.mjs'
import {getDutchGrammar,getDutchVerb,conjugateDutch,dutchQuestion,dutchNounNotes,dutchInflectionLemma,dutchTenses,dutchPrincipalParts} from '../app/core/utils/dutch-grammar.ts'
const course=JSON.parse(await readFile(new URL('../public/dicts/nl/word/all.json',import.meta.url),'utf8'))
const entry=word=>{const result=getDutchGrammar(word);assert.ok(result,word);return result}
const forms=(word,tense,aux)=>conjugateDutch(entry(word),tense,aux).map(row=>row.form)

test('all 2160 entries have meaningful POS; all verb senses have complete subject/tense coverage',()=>{
 assert.equal(course.length,2160)
 const verbEntries=course.filter(word=>entry(word.word).kind==='verb')
 assert.equal(verbEntries.length,461)
 for(const word of course){
  const grammar=entry(word.word)
  assert.equal(word.trans[0].pos,grammar.pos,word.word)
  assert.ok(grammar.posNl&&grammar.pos&&!['搭配',''].includes(grammar.pos))
  if(grammar.kind==='noun'&&!grammar.bare)assert.match(grammar.article,/^(de|het)$/)
  if(grammar.kind==='verb')for(const tense of dutchTenses){
   const rows=conjugateDutch(grammar,tense.id)
   assert.equal(rows.length,7)
   for(const row of rows){assert.ok(row.form);assert.doesNotMatch(row.form,/undefined|null|\{r\}/,word.word);if(row.applicable)assert.notEqual(row.form,'—',word.word)}
  }
 }
})
test('standard regular forms include worked, and core irregular forms distinguish persons',()=>{
 assert.deepEqual(forms('werken','present'),['werk','werkt','werkt','werkt','werken','werken','werken'])
 assert.deepEqual(forms('werken','past'),['werkte','werkte','werkte','werkte','werkten','werkten','werkten'])
 assert.deepEqual(forms('zijn','present'),['ben','bent','bent','is','zijn','zijn','zijn'])
 assert.deepEqual(forms('hebben','present'),['heb','hebt','hebt','heeft','hebben','hebben','hebben'])
 assert.equal(forms('hebben','pluperfect')[4],'hadden gehad')
 assert.equal(forms('zijn','perfect')[4],'zijn geweest')
 assert.equal(forms('spreken','past')[0],'sprak')
 assert.equal(forms('spreken','past')[4],'spraken')
 assert.equal(forms('bakken','perfect')[0],'heb gebakken')
 assert.equal(forms('heten','perfect')[0],'heb geheten')
})
test('separable prefixes move in finite clauses and stay attached in infinitives/participles',()=>{
 assert.equal(forms('opstaan','present')[0],'sta op')
 assert.equal(forms('opstaan','past')[4],'stonden op')
 assert.equal(forms('opstaan','perfect')[0],'ben opgestaan')
 assert.equal(forms('opstaan','pluperfect')[4],'waren opgestaan')
 assert.equal(forms('opstaan','future')[1],'zult opstaan')
 assert.equal(forms('deelnemen aan','present')[0],'neem deel aan …')
 assert.equal(forms('de afspraak nakomen','perfect')[0],'heb de afspraak nagekomen')
 assert.equal(forms('voorkomen','present')[0],'voorkom')
 assert.equal(forms('overleggen','perfect')[0],'heb overlegd')
})
test('reflexive pronouns and full phrase word order agree with all subject groups',()=>{
 assert.deepEqual(forms('zich aanmelden','present'),['meld me aan','meldt je aan','meldt zich aan','meldt zich aan','melden ons aan','melden je aan','melden zich aan'])
 assert.equal(forms('zich aanmelden','perfect')[0],'heb me aangemeld')
 assert.equal(dutchPrincipalParts(entry('zich aanmelden'))[1].value,'meld me aan')
 assert.equal(forms('zich aanmelden','future')[4],'zullen ons aanmelden')
 assert.equal(forms('zich wassen','past')[0],'waste me')
 assert.equal(forms('zich wassen','past')[4],'wasten ons')
 assert.equal(forms('zich aan de regels houden','perfect')[0],'heb me aan de regels gehouden')
 assert.equal(forms('het eens zijn met','present')[0],'ben het eens met …')
})
test('question inversion drops jij t, preserves u and covers modal exceptions',()=>{
 assert.equal(dutchQuestion(entry('werken')),'werk jij?')
 assert.equal(dutchQuestion(entry('werken'),true),'werkt u?')
 assert.equal(dutchQuestion(entry('kunnen')),'kun jij?')
 assert.equal(dutchQuestion(entry('zich aanmelden')),'meld jij je aan?')
 assert.equal(dutchQuestion(entry('zich aanmelden'),true),'meldt u zich aan?')
 assert.equal(dutchQuestion(entry('worden')),'word jij?')
})
test('auxiliaries preserve meaning constraints and future/conditional persons',()=>{
 assert.equal(forms('aankomen','perfect')[0],'ben aangekomen')
 assert.equal(forms('beginnen','perfect')[0],'ben begonnen')
 assert.equal(forms('omgaan met','perfect')[0],'ben omgegaan met …')
 assert.equal(forms('lopen','perfect','hebben')[0],'heb gelopen')
 assert.equal(forms('lopen','perfect','zijn')[0],'ben gelopen')
 assert.deepEqual(getDutchVerb(entry('een bestand herstellen')).auxiliary,['hebben'])
 assert.equal(forms('een bestand herstellen','perfect','zijn')[0],'heb een bestand hersteld')
 assert.equal(forms('werken','conditional')[4],'zouden werken')
 assert.equal(forms('werken','future')[2],'zult werken')
 const happening=conjugateDutch(entry('gebeuren'),'present')
 assert.equal(happening[0].applicable,false);assert.equal(happening[3].form,'gebeurt')
})
test('noun articles, plural-only forms, bare dates and verb phrases are distinguished',()=>{
 assert.equal(entry('het huis').article,'het')
 assert.equal(entry('de afspraak').article,'de')
 assert.equal(entry('de gegevens').number,'plural')
 assert.equal(entry('de ingrediënten').number,'plural')
 assert.equal(entry('de afspraak nakomen').kind,'verb')
 assert.equal(entry('het eens zijn met').kind,'verb')
 assert.equal(entry('het openbaar groen').kind,'noun')
 assert.equal(annotateWord('het advies',{}).countability,'unspecified')
 assert.ok(dutchNounNotes(entry('de gegevens')).some(note=>note.includes('不能直接')))
 assert.ok(dutchNounNotes(entry('maandag')).some(note=>note.includes('op maandag')))
 assert.ok(dutchNounNotes(entry('deeltijd')).some(note=>note.includes('in deeltijd')))
 assert.equal(getDutchGrammar('not-a-course-entry'),null)
})
test('clicked inflected forms can find known course lemmas, without guessing new words',()=>{
 assert.equal(dutchInflectionLemma('sprak'),'spreken')
 assert.equal(dutchInflectionLemma('geweest'),'zijn')
 assert.equal(dutchInflectionLemma('gewerkt'),'werken')
 assert.equal(dutchInflectionLemma('nonexistentform'),null)
})
test('reciprocal elkaar phrases require plural subjects and do not teach singular questions',()=>{
 for(const word of ['elkaar helpen','elkaar ontmoeten','elkaar ondersteunen']){
  const grammar=entry(word),rows=conjugateDutch(grammar,'present')
  assert.ok(rows.slice(0,4).every(row=>!row.applicable&&row.form==='—'))
  assert.ok(rows.slice(4).every(row=>row.applicable&&row.form.includes('elkaar')))
  assert.equal(dutchQuestion(grammar),'')
  assert.equal(dutchPrincipalParts(grammar)[1].label,'wij 现在时')
 }
})
