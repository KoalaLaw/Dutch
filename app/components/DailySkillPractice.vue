<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import microLessons from '@/data/daily-skills.json'
import skills from '@/data/b1-skills.json'
import readings from '@/data/b1-readings.json'
import dialogues from '@/data/daily-dialogues.json'
import { useDailyLearning } from '@/core/composables/useDailyLearning'
import { B1_STATE_KEY, parseB1State, countDutchWords, isWritingReady } from '@/core/utils/b1-learning'
import { emptyDailyDay, nonemptyLines } from '@/core/utils/daily-learning'
import { useTTsPlayAudio, cancelWordPracticeAudio } from '@/core/hooks/sound'
import { Toast } from '@/base'
const props=defineProps<{ day: {id:string;review:boolean;skill:{kind:string;id:string;step?:string}} }>()
const daily=useDailyLearning(), speak=useTTsPlayAudio()
const saved=computed(()=>daily.state.value.days[props.day.id]??emptyDailyDay())
const b1=computed(()=>parseB1State(daily.store.noteData[B1_STATE_KEY]))
const kind=computed(()=>props.day.skill.kind)
const micro=computed(()=>microLessons.find(item=>item.id===props.day.skill.id))
const grammar=computed(()=>skills.grammarUnits.find(item=>item.id===props.day.skill.id))
const reading=computed(()=>readings.find(item=>item.id===props.day.skill.id))
const dialogue=computed(()=>dialogues.find(item=>item.id===props.day.skill.id))
const writing=computed(()=>skills.writingTasks.find(item=>item.id===props.day.skill.id))
const speaking=computed(()=>skills.speakingTasks.find(item=>item.id===props.day.skill.id))
const title=computed(()=>micro.value?.title||grammar.value?.title||reading.value?.titleTranslate||dialogue.value?.titleTranslate||writing.value?.title||speaking.value?.title||'本周表达练习')
const exercises=computed(()=>kind.value==='micro'&&micro.value ? [micro.value.exercise] : kind.value==='grammar'&&grammar.value ? grammar.value.exercises : [])
function b1Update(change:(value:ReturnType<typeof parseB1State>)=>void){if(!daily.store.load)return;const value=parseB1State(daily.store.noteData[B1_STATE_KEY]);change(value);daily.store.noteData[B1_STATE_KEY]=JSON.stringify(value)}
function answer(index:number,value:number){daily.updateDay(props.day.id,day=>{day.answers['q'+index]=value;day.done=day.done.filter(key=>key!=='skill')})}
const production=computed({get:()=>saved.value.production,set:(text:string)=>daily.updateDay(props.day.id,day=>{day.production=text;day.done=day.done.filter(key=>key!=='skill')})})
const draft=computed({get:()=>b1.value.drafts[props.day.skill.id]||'',set:(text:string)=>{b1Update(value=>{value.drafts[props.day.skill.id]=text;delete value.completed[props.day.skill.id]});daily.markTask(props.day.id,'skill',false)}})
const outline=computed({get:()=>daily.state.value.writingNotes[props.day.skill.id]||'',set:(text:string)=>{daily.update(value=>{value.writingNotes[props.day.skill.id]=text});daily.markTask(props.day.id,'skill',false)}})
const speakingNotes=computed({get:()=>b1.value.speakingNotes[props.day.skill.id]||'',set:(text:string)=>{b1Update(value=>{value.speakingNotes[props.day.skill.id]=text;delete value.completed[props.day.skill.id]});daily.markTask(props.day.id,'skill',false)}})
const checked=computed(()=>b1.value.checks[props.day.skill.id]||[])
function b1Check(index:number,enabled:boolean){b1Update(value=>{const checks=new Set(value.checks[props.day.skill.id]||[]);enabled?checks.add(index):checks.delete(index);value.checks[props.day.skill.id]=[...checks];delete value.completed[props.day.skill.id]});daily.markTask(props.day.id,'skill',false)}
function oralCheck(enabled:boolean){daily.updateDay(props.day.id,day=>{day.checks=enabled?[...new Set([...day.checks,9])]:day.checks.filter(n=>n!==9);day.done=day.done.filter(key=>key!=='skill')})}
const oralDone=computed(()=>saved.value.checks.includes(9))
const readCorrect=(question:any,index:number)=>question.correctAnswer.includes(String.fromCharCode(97+saved.value.answers['q'+index]))
const ready=computed(()=>{
  if(kind.value==='micro')return exercises.value.every((q,i)=>saved.value.answers['q'+i]===q.answer)&&countDutchWords(production.value)>=3&&(micro.value?.kind!=='speaking'||oralDone.value)
  if(kind.value==='grammar')return exercises.value.every((q,i)=>saved.value.answers['q'+i]===q.answer)&&countDutchWords(production.value)>=5
  if(kind.value==='reading')return !!reading.value&&reading.value.questions.every(readCorrect)&&countDutchWords(production.value)>=6
  if(kind.value==='dialogue')return oralDone.value&&countDutchWords(production.value)>=3
  if(kind.value==='writing'&&writing.value){
    if(props.day.skill.step==='outline')return nonemptyLines(outline.value)>=3
    if(props.day.skill.step==='draft')return countDutchWords(draft.value)>=60
    return isWritingReady(draft.value,checked.value,writing.value.minWords,writing.value.maxWords,writing.value.checklist.length)
  }
  if(kind.value==='speaking'&&speaking.value)return props.day.skill.step==='prepare'?nonemptyLines(speakingNotes.value)>=3:oralDone.value&&speaking.value.checklist.every((_,i)=>checked.value.includes(i))
  return false
})
const saving=ref(false),remaining=ref(0)
let timer:ReturnType<typeof setInterval>|undefined
function startTimer(){clearInterval(timer);remaining.value=90;timer=setInterval(()=>{if(--remaining.value<=0)clearInterval(timer)},1000)}
async function finish(){if(!ready.value||saving.value)return;saving.value=true;try{
  if(kind.value==='grammar'||kind.value==='reading')b1Update(value=>{
    const count=kind.value==='grammar'?exercises.value.length:reading.value!.questions.length
    for(let i=0;i<count;i++)value.answers[`${kind.value==='grammar'?'g':'r'}:${props.day.skill.id}:${i}`]=saved.value.answers['q'+i]
  })
  if((kind.value==='writing'&&props.day.skill.step==='revise')||(kind.value==='speaking'&&props.day.skill.step==='speak'))b1Update(value=>{value.completed[props.day.skill.id]=true})
  daily.markTask(props.day.id,'skill');await daily.flush();Toast.success('这一项练习已保存')
}catch{daily.markTask(props.day.id,'skill',false);Toast.error('保存未完成，请重试')}finally{saving.value=false}}
onUnmounted(()=>{clearInterval(timer);cancelWordPracticeAudio()})
</script>
<template>
 <section class="daily-skill">
  <div class="skill-top"><span>{{ day.review?'本周整理':'今天的短练习' }}</span><span>约 {{ kind==='writing'&&day.skill.step==='revise'?'10':'8' }} 分钟</span></div>
  <h2>{{ title }}</h2>
  <template v-if="micro">
   <p class="explanation">{{ micro.explanation }}</p>
   <div v-for="(example,i) in micro.examples" :key="example.nl" class="example">
    <button type="button" @click="speak(example.nl)">▶ {{ micro.kind==='listening'?'先听一遍':'荷兰语发音' }}</button>
    <details v-if="micro.kind==='listening'"><summary>显示原文与译文</summary><p lang="nl">{{ example.nl }}</p><p class="translation">{{ example.zh }}</p></details>
    <div v-else><p lang="nl">{{ example.nl }}</p><p class="translation">{{ example.zh }}</p></div>
   </div>
  </template>
  <template v-if="grammar"><p class="explanation">{{ grammar.explanation }}</p><p class="pattern" lang="nl">{{ grammar.pattern }}</p><div v-for="example in grammar.examples" :key="example.nl" class="example"><button type="button" @click="speak(example.nl)">▶ 试听</button><div><p lang="nl">{{ example.nl }}</p><p class="translation">{{ example.zh }}</p></div></div></template>
  <div v-for="(question,i) in exercises" :key="i" class="question"><h3>{{ question.question }}</h3><div class="options"><button v-for="(option,j) in question.options" :key="j" type="button" :class="{selected:saved.answers['q'+i]===j}" :aria-pressed="saved.answers['q'+i]===j" @click="answer(i,j)">{{ String.fromCharCode(65+j) }}. {{ option }}</button></div><p v-if="saved.answers['q'+i]!==undefined" class="feedback" :class="{right:saved.answers['q'+i]===question.answer}">{{ saved.answers['q'+i]===question.answer?'✓ 正确':'再看一次讲解' }} · {{ question.explanation }}</p></div>
  <template v-if="reading"><p class="explanation">先读或听荷兰语，抓住主旨；需要帮助时再打开中文。最后用自己的话写一句总结。</p><div v-for="(paragraph,i) in reading.paragraphs" :key="i" class="reading-paragraph"><button type="button" @click="speak(paragraph.map(pair=>pair[0]).join(' '))">▶ 朗读本段</button><p lang="nl">{{ paragraph.map(pair=>pair[0]).join(' ') }}</p><details><summary>查看本段中文</summary><p class="translation">{{ paragraph.map(pair=>pair[1]).join(' ') }}</p></details></div><div v-for="(question,i) in reading.questions" :key="i" class="question"><h3>{{ question.stem }}</h3><div class="options"><button v-for="(option,j) in question.options" :key="j" :class="{selected:saved.answers['q'+i]===j}" type="button" @click="answer(i,j)">{{ String.fromCharCode(65+j) }}. {{ option }}</button></div><p v-if="saved.answers['q'+i]!==undefined" class="feedback" :class="{right:readCorrect(question,i)}">{{ readCorrect(question,i)?'✓ 正确':'回到原文找线索' }} · {{ question.explanation }}</p></div></template>
  <template v-if="dialogue"><p class="explanation">先听，再跟读。最后关掉原文，用自己的话说出一句回应。</p><div v-for="(line,i) in dialogue.lines" :key="i" class="example"><button type="button" @click="speak(line[0])">▶</button><div><p lang="nl">{{ line[0] }}</p><p class="translation">{{ line[1] }}</p></div></div></template>
  <template v-if="writing">
   <p class="explanation">{{ writing.prompt }}</p><p class="scenario" lang="nl">{{ writing.scenario }}</p>
   <ul><li v-for="item in writing.requirements" :key="item">{{ item }}</li></ul>
   <template v-if="day.skill.step==='outline'"><h3>今天只列提纲，不用一次写完</h3><p>写下至少 3 行要点：写给谁、为什么写、希望对方做什么。可以使用中文或荷兰语关键词。</p><label for="writing-outline">3 行提纲</label><textarea id="writing-outline" v-model="outline" rows="5" placeholder="1. 我想说明什么…&#10;2. 一个具体细节…&#10;3. 我希望对方…" /></template>
   <template v-else><details v-if="outline"><summary>回看之前的提纲</summary><p class="prewrap">{{ outline }}</p></details><h3>{{ day.skill.step==='draft'?'今天先写前半篇，至少 60 词':'补齐、修改并检查整篇' }}</h3><p>{{ day.skill.step==='draft'?'可从称呼、目的和一个细节写起；下一次复习日再补齐结尾。':'目标为 100–150 词，检查是否连贯、有理由、有明确请求或结论。' }}</p><label for="daily-writing">你的荷兰语草稿</label><textarea id="daily-writing" v-model="draft" lang="nl" rows="9" placeholder="先写自己的版本，再看范文。"/><div class="word-count">已写 {{ countDutchWords(draft) }} 词 · {{ day.skill.step==='draft'?'今天至少 60 词':'最终 100–150 词' }}</div><div v-if="day.skill.step==='revise'" class="checks"><label v-for="(item,i) in writing.checklist" :key="item"><input type="checkbox" :checked="checked.includes(i)" @change="b1Check(i,($event.target as HTMLInputElement).checked)"/>{{ item }}</label></div></template>
   <details class="model"><summary>完成自己的版本后，对照范文</summary><button type="button" @click="speak(writing.model)">▶ 朗读范文</button><p lang="nl" class="prewrap">{{ writing.model }}</p><p class="translation prewrap">{{ writing.modelTranslation }}</p></details>
  </template>
  <template v-if="speaking"><p class="scenario" lang="nl">{{ speaking.scenario }}</p><ul><li v-for="item in speaking.prompts" :key="item">{{ item }}</li></ul><div v-for="phrase in speaking.phrases" :key="phrase.nl" class="example"><button type="button" @click="speak(phrase.nl)">▶</button><div><p lang="nl">{{ phrase.nl }}</p><p class="translation">{{ phrase.zh }}</p></div></div><h3>{{ day.skill.step==='prepare'?'先准备 3 个要点':'脱离范文，连贯说一次' }}</h3><label for="daily-speaking-notes">口语提纲（至少 3 行）</label><textarea id="daily-speaking-notes" v-model="speakingNotes" rows="5" placeholder="开头说什么？&#10;给什么理由？&#10;举什么例子？"/><template v-if="day.skill.step==='speak'"><div class="timer"><button type="button" @click="startTimer">开始 90 秒练习</button><span role="timer">{{ remaining ? remaining+' 秒' : '按自己的节奏练习' }}</span></div><p class="translation">计时仅用于练习，不录音，也不自动评判口语水平。</p><div class="checks"><label v-for="(item,i) in speaking.checklist" :key="item"><input type="checkbox" :checked="checked.includes(i)" @change="b1Check(i,($event.target as HTMLInputElement).checked)"/>{{ item }}</label></div></template><details class="model"><summary>练习后对照示范</summary><button type="button" @click="speak(speaking.model)">▶ 听示范</button><p lang="nl">{{ speaking.model }}</p><p class="translation">{{ speaking.modelTranslation }}</p></details></template>
  <template v-if="['micro','grammar','reading','dialogue'].includes(kind)"><label for="daily-production">{{ micro?.prompt || (reading?'用荷兰语写一句自己的总结。':grammar?'用今天的句型写 1–2 句自己的话。':'记录你刚才用荷兰语说过的一句话。') }}</label><textarea id="daily-production" v-model="production" lang="nl" rows="3" placeholder="用自己的话写下来…"/></template>
  <label v-if="kind==='dialogue'||micro?.kind==='speaking'||(kind==='speaking'&&day.skill.step==='speak')" class="oral-check"><input type="checkbox" :checked="oralDone" @change="oralCheck(($event.target as HTMLInputElement).checked)"/>我已不看范文，自己开口说过一次。</label>
  <div class="finish-row"><button type="button" class="finish" :disabled="!ready||saving||!daily.store.load" @click="finish">{{ saving?'正在保存…':saved.done.includes('skill')?'✓ 本项已保存':'完成这项练习并保存 ✓' }}</button><small>草稿和练习随学习数据一起备份。</small></div>
 </section>
</template>
<style scoped>
.daily-skill{background:#fffef9;border:1px solid #dde4d3;border-radius:14px;padding:25px;color:#293e34;font-size:13px;line-height:1.9}.skill-top{display:flex;justify-content:space-between;color:#67785e;font-size:11px}h2{font-size:23px;line-height:1.5;margin:14px 0}h3{font-size:15px;margin:20px 0 10px}.explanation{white-space:pre-line;color:#52634e}.pattern,.scenario{padding:12px 16px;background:#f0f3e7;border-radius:7px}.example{display:flex;gap:15px;padding:14px 0;border-bottom:1px solid #e9ecdf}.example>button{align-self:flex-start;white-space:nowrap}.example p{margin:0}.translation{color:#66735c;font-size:12px}.question{padding:15px 0;border-bottom:1px solid #e5e8da}.options{display:grid;grid-template-columns:1fr 1fr;gap:9px}.options button{text-align:left;line-height:1.8}.options .selected{background:#e8efdf;border-color:#7c9867}.feedback{padding:9px 12px;border-radius:6px;color:#97472e;background:#fff0e5}.feedback.right{color:#3e6134;background:#edf3e4}button{font:inherit;color:#355137;background:#f2f5e9;border:1px solid #cfdbc3;padding:9px 14px;border-radius:7px;cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible,textarea:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid #ba562d;outline-offset:3px}.reading-paragraph{padding:15px 0;border-bottom:1px solid #e2e7d8}.reading-paragraph>p{font-size:15px;line-height:2}details{padding:8px 0}summary{cursor:pointer;color:#60774d}textarea{display:block;box-sizing:border-box;width:100%;font:inherit;line-height:1.8;border:1px solid #bccbae;background:white;color:#29402f;border-radius:7px;padding:13px;resize:vertical}label:not(.checks label){display:block;margin:16px 0 8px;font-size:12px;font-weight:500}.prewrap{white-space:pre-wrap}.word-count{font-size:12px;color:#627253;margin-top:7px}.checks{display:grid;gap:10px;margin:15px 0}.checks label,.oral-check{display:flex!important;align-items:flex-start;gap:9px;line-height:1.7}input[type=checkbox]{accent-color:#6c8b53;flex-shrink:0;margin-top:5px}.timer{display:flex;align-items:center;gap:15px;margin:15px 0}.model{background:#f3f5e9;border-radius:7px;padding:13px 16px;margin:20px 0}.model button{margin-top:15px}.finish-row{display:flex;gap:16px;align-items:center;flex-wrap:wrap;border-top:1px solid #e3e8d9;margin-top:23px;padding-top:20px}.finish-row .finish{background:#b94e28;color:white;border-color:#b94e28}.finish-row small{font-size:11px;color:#66735b}@media(max-width:600px){.daily-skill{padding:18px}.options{grid-template-columns:1fr}h2{font-size:20px}.example{gap:10px}.example>button{padding:7px 9px}}
</style>
