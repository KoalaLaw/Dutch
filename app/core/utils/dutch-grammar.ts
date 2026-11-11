import data from '../../data/dutch-grammar.json' with { type: 'json' }

export type DutchWordGrammar = {
 kind: string; pos: string; posNl: string; lemma?: string; article?: 'de'|'het';
 number?: 'singular'|'plural'; countability?: 'mass'|'unspecified'; bare?: boolean;
 object?: string; after?: string;
 auxiliary?: ('hebben'|'zijn')[];
}
export type DutchVerb = {
 present: [string,string,string]; past: [string,string]; participle: string;
 prefix?: string; auxiliary: ('hebben'|'zijn')[]; impersonal?: boolean;
}
const grammar = data as unknown as {entries:Record<string,DutchWordGrammar>;verbs:Record<string,DutchVerb>}
export const dutchTenses = [
 {id:'present',label:'现在时',nl:'OTT',hint:'现在的状态、习惯或事实。主句中，可分前缀放到句末。'},
 {id:'past',label:'过去时',nl:'OVT',hint:'叙述过去的状态或经过。单数人称共用一种过去式，复数共用另一种。'},
 {id:'perfect',label:'现在完成时',nl:'VTT',hint:'叙述已经发生的事：hebben / zijn 的现在式＋过去分词。'},
 {id:'pluperfect',label:'过去完成时',nl:'VVT',hint:'在过去某一时刻之前已经发生：had / was（复数 hadden / waren）＋过去分词。'},
 {id:'future',label:'将来表达',nl:'zullen',hint:'zullen＋动词原形。荷兰语也常用现在时加时间词表达将来，例如 Morgen werk ik.'},
 {id:'conditional',label:'假设 / 委婉',nl:'zouden',hint:'zou / zouden＋动词原形，常用于假设、愿望或委婉请求；不等同于所有过去时间。'},
] as const
export type DutchTense = (typeof dutchTenses)[number]['id']
export const dutchPersons = [
 {subject:'ik',cn:'我',reflexive:'me',person:0,plural:false},
 {subject:'jij / je',cn:'你',reflexive:'je',person:1,plural:false},
 {subject:'u',cn:'您',reflexive:'zich',person:1,plural:false},
 {subject:'hij / zij / het',cn:'他 / 她 / 它',reflexive:'zich',person:2,plural:false},
 {subject:'wij / we',cn:'我们',reflexive:'ons',person:0,plural:true},
 {subject:'jullie',cn:'你们',reflexive:'je',person:1,plural:true},
 {subject:'zij / ze',cn:'他们 / 她们',reflexive:'zich',person:2,plural:true},
] as const
const normalize = (text:string)=>text.trim().normalize('NFC').toLocaleLowerCase('nl').replace(/\s+/g,' ')
export function getDutchGrammar(value:string|{word:string}):DutchWordGrammar|null {
 const word=normalize(typeof value==='string'?value:value.word)
 return grammar.entries[word]??(grammar.verbs[word]?{kind:'verb',pos:'动词',posNl:'werkwoord',lemma:word,object:'',after:''}:null)
}
export function getDutchVerb(entry:DutchWordGrammar|null):DutchVerb|null {
 const verb=entry?.kind==='verb'&&entry.lemma?grammar.verbs[entry.lemma]??null:null
 return verb&&entry?.auxiliary?{...verb,auxiliary:entry.auxiliary}:verb
}
const join = (...parts:(string|undefined)[])=>parts.filter(Boolean).join(' ').replace(/\s+/g,' ').trim()
function finite(lemma:string,verb:DutchVerb,person:number,plural:boolean,past=false) {
 return past?verb.past[plural?1:0]:plural?lemma:verb.present[person]
}
function splitFinite(form:string,prefix?:string){return prefix&&form.startsWith(prefix)?form.slice(prefix.length):form}
export function conjugateDutch(entry:DutchWordGrammar|null,tense:DutchTense,auxiliary?:'hebben'|'zijn') {
 const verb=getDutchVerb(entry)
 if(!verb||!entry?.lemma)return []
 const lemma=entry.lemma,prefix=verb.prefix,aux=auxiliary&&verb.auxiliary.includes(auxiliary)?auxiliary:verb.auxiliary[0]
 return dutchPersons.map((person,index)=>{
  const object=(entry.object??'').replaceAll('{r}',person.reflexive)
  let form:string
  if(tense==='present'||tense==='past')form=join(splitFinite(finite(lemma,verb,person.person,person.plural,tense==='past'),prefix),object,prefix,entry.after)
  else if(tense==='perfect'||tense==='pluperfect')form=join(finite(aux,grammar.verbs[aux],person.person,person.plural,tense==='pluperfect'),object,verb.participle,entry.after)
  else form=join(finite('zullen',grammar.verbs.zullen,person.person,person.plural,tense==='conditional'),object,lemma,entry.after)
  const applicable=(!verb.impersonal||index===3||index===6)&&(!entry.object?.includes('elkaar')||person.plural)&&(!['perfect','pluperfect'].includes(tense)||verb.participle!=='—')
  return {...person,form:applicable?form:'—',applicable}
 })
}
export function dutchQuestion(entry:DutchWordGrammar|null,polite=false) {
 const verb=getDutchVerb(entry)
 if(!verb||!entry?.lemma||verb.impersonal||entry.object?.includes('elkaar'))return ''
 const main=polite?verb.present[1]:({kunnen:'kun',zullen:'zul'}[entry.lemma]??verb.present[0])
 return join(splitFinite(main,verb.prefix),polite?'u':'jij',(entry.object??'').replaceAll('{r}',polite?'zich':'je'),verb.prefix,entry.after)+'?'
}
export function dutchPrincipalParts(entry:DutchWordGrammar|null) {
 const verb=getDutchVerb(entry)
 if(!verb||!entry?.lemma)return []
 const reciprocal=entry.object?.includes('elkaar')
 return [
  {label:'原形',value:entry.lemma},
  {label:verb.impersonal?'het 现在时':reciprocal?'wij 现在时':'ik 现在时',value:conjugateDutch(entry,'present')[verb.impersonal?3:reciprocal?4:0].form},
  {label:'过去式 · 动词单数 / 复数',value:verb.past.map(form=>join(splitFinite(form,verb.prefix),verb.prefix)).join(' / ')},
  {label:'过去分词',value:verb.participle},
 ]
}
export function dutchVerbNotes(entry:DutchWordGrammar|null) {
 const verb=getDutchVerb(entry)
 if(!verb||!entry?.lemma)return []
 const notes=['jij / je 作主语并紧跟在现在时动词后时，通常不加词尾 -t；u 倒装时保留自己的形式。']
 if(verb.prefix)notes.push('这是可分动词：主句中前缀与动词分开；与 zullen 或完成时连用时，原形 / 过去分词保持整体。')
 if(entry.object?.includes('{r}'))notes.push('反身代词随主语改变：ik → me，jij → je，u / hij / zij → zich，wij → ons，jullie → je，zij（复数）→ zich。u 也可使用反身代词 u。')
 if(verb.auxiliary.length>1)notes.push('hebben / zijn 随含义选择：行为、持续活动或带宾语常用 hebben；方向、结果或状态变化常用 zijn。请结合本词例句理解，不能随意互换。')
 if(['kunnen','moeten','willen','durven'].includes(entry.lemma))notes.push('与另一个动词原形连用的完成时，常出现“双不定式”：Ik heb moeten werken. 此时不能把表中的独立过去分词直接接在另一个原形前。')
 if(entry.lemma==='kunnen')notes.push('jij / u kan 也正确；这里主表采用较中性的 kunt。倒装常用 kun jij，也可以 kan jij。')
 if(entry.lemma==='willen')notes.push('jij / u wil 也可使用；主表采用 wilt。第三人称用 hij wil，不写 hij wilt。过去时也常见 wou / wouden，主表采用 wilde / wilden。')
 if(entry.lemma==='hebben')notes.push('u hebt 和 u heeft 都正确，主表使用 u hebt。')
 if(entry.lemma==='houden'||entry.lemma.endsWith('houden'))notes.push('ik houd 与 ik hou 都可使用；主表采用 houd，第二 / 第三人称仍为 houdt。')
 if(entry.lemma==='voorkomen')notes.push('这里按课程“防止”的义项处理，为不可分动词：ik voorkom afval。表示“发生 / 出现”时读音重音和语序不同：het komt voor。')
 if(entry.lemma==='overleggen')notes.push('本词条“商量”用不可分形式 ik overleg / heb overlegd；不要拆成 ik leg over。')
 if(verb.impersonal)notes.push('这个义项通常以 het 或事情 / 事物作主语；不硬套“我发生、你发生”等第一 / 第二人称表达。')
 if(entry.object?.includes('elkaar'))notes.push('elkaar 表示“彼此 / 互相”，这里需要复数或并列主语，例如 wij helpen elkaar。表中不将其硬套到单数主语。')
 if(verb.participle==='—')notes.push('这个助动词没有本表可用的独立完成时形式；对应栏位不强行生成过去分词。')
 return notes
}
export function dutchNounNotes(entry:DutchWordGrammar|null) {
 if(entry?.kind!=='noun')return []
 if(entry.bare)return [['deeltijd','voltijd'].includes(entry.lemma??'')?'常用搭配为 in deeltijd（非全日制）或 in voltijd（全日制），此时不加冠词。':'星期和月份在常用时间表达中一般不带冠词：op maandag、in januari；有特指或限定修饰时，用法可能改变。']
 if(entry.number==='plural')return ['本词条是复数形式，定冠词用 de，不用 het。','een 只用于可数单数，不能直接放在这个复数词条前。','泛指复数常不带冠词；特指已经知道的一组事物时，用 de。']
 const notes=[entry.article==='het'?'这是 het 词（中性）。特指本词条所指的事物时，用 het。':'这是 de 词（通性）。特指本词条所指的人、事物或概念时，用 de。',
  'de / het 表示特指或双方已经知道的对象。可数单数首次提到“某一个”时用 een；泛指复数、物质或抽象意义需看语境，不能一律加 een。',
  '复数定冠词统一用 de；单数缩小词一般用 het，例如 de tafel → het tafeltje。冠词应和名词一起记。']
 if(entry.countability==='mass')notes.splice(1,0,'这个义项常表示物质、整体或抽象概念，泛指时常省略冠词。若表示一份、某一种或其他可数义，用法会不同。')
 return notes
}

// Known finite/participle forms can resolve to a course lemma during click lookup.
// Exact course words always take priority in the caller; no generated noun plurals.
let inflections:Map<string,string>|undefined
export function dutchInflectionLemma(value:string) {
 inflections??=new Map(Object.entries(grammar.verbs).flatMap(([lemma,verb])=>[...verb.present,...verb.past,verb.participle].filter(form=>form&&form!=='—').map(form=>[normalize(form),lemma] as [string,string])))
 return inflections.get(normalize(value))??null
}
