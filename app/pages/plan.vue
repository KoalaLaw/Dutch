<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import plan from '@/data/daily-plan.json'
import curriculum from '@/data/dutch-curriculum.json'
import DailyWordPractice from '@/components/DailyWordPractice.vue'
import DailySkillPractice from '@/components/DailySkillPractice.vue'
import { useDailyLearning, loadDailyWords } from '@/core/composables/useDailyLearning'
import { dailyTaskKeys, emptyDailyDay, isDailyComplete, recommendedDay, nonemptyLines, type DailyWordSession } from '@/core/utils/daily-learning'
import { usePlayWordAudio, cancelWordPracticeAudio } from '@/core/hooks/sound'
import type { Word } from '@/core/types'
import { Toast } from '@/base'

const route=useRoute(),router=useRouter(),daily=useDailyLearning(),play=usePlayWordAudio()
const allWords=shallowRef<Word[]>([]),loadError=ref(''),busy=ref(false),saving=ref(false)
const recommended=computed(()=>recommendedDay(plan.days,daily.state.value))
const day=computed(()=>plan.days.find(item=>item.id===route.query.day)||recommended.value)
const week=computed(()=>plan.weeks[day.value.week-1])
const phase=computed(()=>plan.phases.find(item=>item.id===day.value.stage)!)
const dayState=computed(()=>daily.state.value.days[day.value.id]??emptyDailyDay())
const activeTask=computed(()=>dailyTaskKeys(day.value).includes(String(route.query.task))?String(route.query.task):'')
const taskNames:Record<string,string>={review:'复习旧词',vocabulary:'今天的 10 个新词',skill:'短练习与表达',check:'本周自检与整理'}
const completedDays=computed(()=>plan.days.filter(item=>isDailyComplete(item,daily.state.value)).length)
const routeFinished=computed(()=>plan.days.filter(item=>item.number>=daily.state.value.startDay).every(item=>isDailyComplete(item,daily.state.value)))
const wordMap=computed(()=>new Map(allWords.value.map(word=>[word.id,word])))
const currentSession=computed(()=>dayState.value.sessions[activeTask.value])
const weekDone=computed(()=>week.value.dayIds.filter(id=>isDailyComplete(plan.days.find(item=>item.id===id)!,daily.state.value)).length)
const learnedIds=computed(()=>{
 const ids=new Set(Object.keys(daily.state.value.words))
 for(const pack of daily.store.word.bookList){if(!curriculum.some(item=>item.id===pack.id))continue
  allWords.value.filter(word=>word.id.startsWith(pack.id+'-')).slice(0,pack.complete?pack.length:pack.lastLearnIndex).forEach(word=>ids.add(word.id))
 }
 const known=new Set(daily.store.known.words.map(word=>word.word))
 for(const word of allWords.value)if(daily.store.fsrsData[word.word]||known.has(word.word))ids.add(word.id)
 return ids
})
const eligibleReview=computed(()=>{
 const now=Date.now(),known=new Set(daily.store.known.words.map(word=>word.word))
 const priorIds=new Set(plan.days.filter(item=>item.number<day.value.number).flatMap(item=>item.wordIds))
 const thisWeek=new Set(week.value.packIds)
 const wrong=new Set(daily.store.wrong.words.map(word=>word.word))
 const pool=allWords.value.filter(word=>(!known.has(word.word)&&(learnedIds.value.has(word.id)||wrong.has(word.word)))||(day.value.review&&[...thisWeek].some(id=>word.id.startsWith(id+'-'))))
 const rank=(word:Word)=>{const card=daily.store.fsrsData[word.word];const due=card?new Date(String(card.due)).getTime():Date.parse(daily.state.value.words[word.id]?.due||'');return wrong.has(word.word)?0:due<=now?1:priorIds.has(word.id)?2:3}
 const sorted=pool.sort((a,b)=>rank(a)-rank(b)||a.id.localeCompare(b.id))
 if(day.value.review){const balanced=week.value.packIds.flatMap(id=>sorted.filter(word=>word.id.startsWith(id+'-')).slice(0,5));return [...balanced,...sorted.filter(word=>!balanced.some(item=>item.id===word.id))].slice(0,10)}
 return sorted.slice(0,5)
})
const reviewEmpty=computed(()=>{const session=dayState.value.sessions.review;return session?!session.ids.length:!eligibleReview.value.length})
const reflection=computed({get:()=>dayState.value.reflection,set:(text:string)=>daily.updateDay(day.value.id,value=>{value.reflection=text;value.done=value.done.filter(key=>key!=='check')})})
const criteria=computed(()=>week.value.checkpoint?phase.value.criteria:[
 '我能不看原词，回想本周常用词的拼写和意思。',
 '我听过并跟读过本周例句，知道自己哪里容易听错。',
 '我能用本周的词或句型，说出 3 句自己的话。',
 '我已完成本周表达练习，并记录下要继续巩固的地方。',
])
const canFinishCheck=computed(()=>criteria.value.every((_,i)=>dayState.value.checks.includes(i))&&nonemptyLines(reflection.value)>=2&&(dayState.value.scores.review??0)>=.8&&dayState.value.done.includes('skill'))
function chooseDay(id:string){cancelWordPracticeAudio();router.replace({path:'/plan',query:{day:id}})}
function chooseWeek(value:string){const number=Number(value);const target=plan.weeks[number-1];if(target)chooseDay(target.dayIds[0])}
function startAt(firstDay:number){daily.update(value=>{value.startDay=firstDay});chooseDay(plan.days[firstDay-1].id);void save()}
async function load(){loadError.value='';try{allWords.value=await loadDailyWords()}catch{loadError.value='词表暂时未能加载，请检查网络后重试。'}}
async function save(){saving.value=true;try{await daily.flush()}catch{Toast.error('保存未完成，请稍后重试')}finally{saving.value=false}}
async function openTask(key:string,restart=false){
 if(!daily.store.load||!allWords.value.length||busy.value)return
 if(['review','vocabulary'].includes(key)){
  if(!dayState.value.sessions[key]||restart){
   const ids=key==='review'?eligibleReview.value.map(word=>word.id):day.value.wordIds
   daily.updateDay(day.value.id,value=>{value.sessions[key]={ids:[...ids],index:0,round:key==='review'?'recall':'learn',missed:[],correct:0,input:''};value.done=value.done.filter(item=>item!==key&&(key!=='review'||item!=='check'));delete value.scores[key]})
  }
  const session=dayState.value.sessions[key],word=wordMap.value.get(session.ids[session.index])
  if(word&&session.round!=='done')play(word.word,false)
 }
 await router.replace({path:'/plan',query:{day:day.value.id,task:key}})
 void save()
}
async function updateSession(session:DailyWordSession,word?:Word,helped=false){
 if(busy.value)return
 const id=day.value.id,key=activeTask.value
 if(!['review','vocabulary'].includes(key))return
 const checkpoint=!!word||session.round==='done'||session.round!==dayState.value.sessions[key]?.round
 busy.value=checkpoint
 try{
  if(word)await daily.recordWord(word,helped)
  daily.updateDay(id,value=>{value.sessions[key]=session;if(session.round==='done'){value.done=[...new Set([...value.done,key])];value.scores[key]=session.ids.length?session.correct/session.ids.length:1}})
  if(checkpoint)await daily.flush()
 }catch{Toast.error('保存未完成，请使用下方保存按钮重试')}finally{busy.value=false}
}
async function skipEmptyReview(){daily.updateDay(day.value.id,value=>{value.done=[...new Set([...value.done,'review'])];value.scores.review=1});await save();await router.replace({path:'/plan',query:{day:day.value.id}})}
function check(index:number,enabled:boolean){daily.updateDay(day.value.id,value=>{const checks=new Set(value.checks);enabled?checks.add(index):checks.delete(index);value.checks=[...checks];value.done=value.done.filter(key=>key!=='check')})}
async function finishCheck(){if(!canFinishCheck.value)return;daily.markTask(day.value.id,'check');await save()}
function nextDay(){const next=plan.days[day.value.number];if(next)chooseDay(next.id)}
watch(()=>day.value.id,()=>{cancelWordPracticeAudio();nextTick(()=>document.querySelector('.plan-page')?.scrollTo({top:0,behavior:'auto'}))})
onMounted(load)
onUnmounted(()=>{cancelWordPracticeAudio();void daily.flush().catch(()=>{})})
useSeoMeta({title:'Type Dutch · 每日学习路线',description:'每天20–30分钟，36周的A1→B1自定进度学习路线。'})
</script>

<template>
 <main class="plan-page">
  <div class="plan-wrap">
   <header class="plan-header"><NuxtLink to="/">← 学习首页</NuxtLink><span>ELKE DAG EEN STAP VERDER</span><NuxtLink to="/vocabulary">72 个词汇主题 ↗</NuxtLink></header>
   <section class="plan-hero"><div><div class="eyebrow">A1 → A2 → B1 · 每天 20–30 分钟</div><h1>今天学什么，<br><em>下一步也清楚。</em></h1><p>每周 6 天学新内容，第 7 天复习。按完成进度继续，暂停几天也能接着学。</p></div><div class="overall-progress"><strong>{{ completedDays }}<small>/ {{ plan.dayCount }} 天</small></strong><div class="progress"><i :style="{width:completedDays/plan.dayCount*100+'%'}"/></div><p>{{ Object.keys(daily.state.value.words).length }} 条路线词汇已练习 · 原有学习记录保留</p><button type="button" @click="chooseDay(recommended.id)">回到当前进度 · 第 {{ recommended.number }} 天 →</button></div></section>
   <section class="phase-grid" aria-label="分阶段路线"><article v-for="item in plan.phases" :key="item.id" :class="{current:item.id===day.stage}"><span>{{ item.level }} · 第 {{ item.firstWeek }}–{{ item.lastWeek }} 周</span><h2>{{ item.label }}</h2><p>{{ item.goal }}</p><div>{{ item.packCount }} 主题 · {{ item.wordCount }} 词汇与搭配</div><button type="button" @click="chooseDay(plan.days[item.firstDay-1].id)">查看本阶段 →</button></article></section>
   <section class="week-toolbar"><label for="plan-week">选择周次</label><select id="plan-week" :value="day.week" @change="chooseWeek(($event.target as HTMLSelectElement).value)"><optgroup v-for="item in plan.phases" :key="item.id" :label="item.label"><option v-for="weekItem in plan.weeks.filter(w=>w.stage===item.id)" :key="weekItem.number" :value="weekItem.number">第 {{ weekItem.number }} 周 · {{ weekItem.title }}</option></optgroup></select><span>本周完成 {{ weekDone }} / 7 天</span><button type="button" class="quiet" v-if="day.number===phase.firstDay&&daily.state.value.startDay!==phase.firstDay" @click="startAt(phase.firstDay)">已有相应基础？从这一阶段开始</button></section>
   <div class="week-title"><div><span class="eyebrow">WEEK {{ String(day.week).padStart(2,'0') }}</span><h2>{{ week.title }}</h2></div><span v-if="week.checkpoint" class="checkpoint-badge">本周含阶段自检</span></div>
   <nav class="day-strip" aria-label="本周七天"><button v-for="id in week.dayIds" :key="id" type="button" :class="{selected:id===day.id,complete:isDailyComplete(plan.days.find(item=>item.id===id)!,daily.state.value)}" :aria-current="id===day.id?'step':undefined" @click="chooseDay(id)"><small>第 {{ plan.days.find(item=>item.id===id)!.number }} 天</small><b>{{ plan.days.find(item=>item.id===id)!.review?'复习日':'学习日 '+plan.days.find(item=>item.id===id)!.weekday }}</b><span>{{ isDailyComplete(plan.days.find(item=>item.id===id)!,daily.state.value)?'✓ 已完成':id===day.id?'正在查看':'待练习' }}</span></button></nav>
   <section class="today-header"><div><span class="eyebrow">DAY {{ String(day.number).padStart(3,'0') }} · {{ phase.level }}</span><h2>{{ day.title }}</h2><p>{{ day.review?'今天不加新词：回顾本周词汇，整理表达，再做自检。':'先回顾旧词，再完成一组 10 词，最后只做一项短练习。' }}</p></div><span class="save-label">{{ !daily.store.load?'正在恢复进度…':daily.saveStatus.value==='error'?'保存未确认，请点击下方立即保存':daily.saveStatus.value==='saving'||saving||busy?'保存中…':'进度自动保存在此浏览器' }}</span></section>
   <div v-if="loadError" role="alert" class="load-error">{{ loadError }} <button type="button" @click="load">重新加载词表</button></div>
   <section class="task-grid" aria-label="今天的三项任务"><button v-for="(key,i) in dailyTaskKeys(day)" :key="key" type="button" :class="{active:activeTask===key,done:dayState.done.includes(key)}" :disabled="!daily.store.load||!allWords.length" @click="openTask(key)"><span>{{ dayState.done.includes(key)?'✓':String(i+1).padStart(2,'0') }}</span><div><h3>{{ taskNames[key] }}</h3><p>{{ key==='review'?(day.review?'约 7 分钟 · 10 词综合回顾':'约 5 分钟 · 先复习 5 个旧词'):key==='vocabulary'?'约 10 分钟 · 跟写后再听写':key==='check'?'约 5 分钟 · 记录要巩固的地方':'约 8–10 分钟 · '+day.skill.title }}</p></div><b>{{ dayState.done.includes(key)?'查看':'开始 →' }}</b></button></section>
   <div class="activity" v-if="activeTask && daily.store.load">
    <template v-if="['review','vocabulary'].includes(activeTask)">
     <div v-if="activeTask==='review'&&reviewEmpty" class="empty-review"><h3>目前没有需要回顾的旧词</h3><p>首次开始时可以直接学今天的新词。以后会优先安排到期词、错词和已经学过的内容。</p><button type="button" @click="skipEmptyReview">继续今天的新内容 →</button></div>
     <template v-else-if="currentSession"><DailyWordPractice :key="day.id+activeTask" :words="allWords" :session="currentSession" :busy="busy" :review="activeTask==='review'" @update="updateSession"/><div class="session-actions" v-if="currentSession.round==='done'"><span v-if="day.review&&(dayState.scores.review??0)<.8">本周回忆正确率尚未到 80%，先再练一遍。</span><button type="button" @click="openTask(activeTask,true)">再练一遍</button><button type="button" @click="router.replace({path:'/plan',query:{day:day.id}})">回到今天的任务</button></div></template>
    </template>
    <DailySkillPractice v-else-if="activeTask==='skill'" :key="day.id" :day="day"/>
    <section v-else-if="activeTask==='check'" class="weekly-check"><span class="eyebrow">{{ week.checkpoint?'阶段能力自检':'每周回顾' }} · 学习者自评</span><h2>{{ week.checkpoint?phase.level+'：能不能真正用出来？':'把这一周的内容留下来' }}</h2><p>先完成词汇回顾和本周表达，再按自己的实际表现勾选。需要巩固的项目可以回来重练。</p><p class="review-score">本周听写一次答对：{{ Math.round((dayState.scores.review??0)*100) }}% · 目标至少 80%</p><label v-for="(item,i) in criteria" :key="item"><input type="checkbox" :checked="dayState.checks.includes(i)" @change="check(i,($event.target as HTMLInputElement).checked)"/>{{ item }}</label><label for="weekly-reflection" class="reflection-label">记下至少 2 行：哪些词容易忘？哪些表达还想再练？</label><textarea id="weekly-reflection" v-model="reflection" rows="4" placeholder="1. 我想再练…&#10;2. 下周注意…"/><button class="primary" type="button" :disabled="!canFinishCheck" @click="finishCheck">完成自检并保存 ✓</button><p v-if="!canFinishCheck" class="check-help">完成词汇回顾、表达练习和上面的自评后，即可保存本周完成记录。</p></section>
   </div>
   <section v-if="isDailyComplete(day,daily.state.value)" class="day-finished"><div><span>✓ 第 {{ day.number }} 天完成</span><h3>{{ routeFinished?'你选择的路线已完成，继续在真实场景中检验能力。':day.number===252?'末尾任务已练完，还可以补齐前面的学习日。':'今天到这里，也很好。' }}</h3><p>可以明天继续，也可以回看今天的笔记和例句。</p></div><button v-if="day.number<252" type="button" @click="nextDay">进入第 {{ day.number+1 }} 天 →</button><button v-else-if="!routeFinished" type="button" @click="chooseDay(recommended.id)">继续未完成的学习日 →</button></section>
   <footer class="plan-footer"><p>36 周是这套材料的一轮学习安排，达到 B1 取决于实际听、说、读、写表现。阶段自检不是考试认证；遇到薄弱项请放慢进度、重复练习，并增加真实荷兰语交流。</p><p>词汇卡片保留原有练习记录，每日任务另行记录完成情况。换设备前可在 <NuxtLink to="/setting">设置中导出学习备份</NuxtLink>。<button type="button" @click="save">{{ saving?'保存中…':'立即保存' }}</button></p><a href="https://erk-nederlands.taalunie.org/erk-niveau/b1/" target="_blank" rel="noopener noreferrer">B1 能力说明 · Nederlandse Taalunie ↗</a></footer>
  </div>
 </main>
</template>
<style scoped>
.plan-page{height:100%;overflow:auto;background:#fafaf4;color:#293e35;font:14px/1.8 "Segoe UI","Microsoft YaHei",sans-serif}.plan-wrap{max-width:1180px;margin:auto;padding:25px 36px 60px;box-sizing:border-box}*{box-sizing:border-box}button,input,textarea,select{font:inherit}button{cursor:pointer}button:disabled{opacity:.5;cursor:default}button,a,input,textarea,select{outline-offset:4px}button:focus-visible,a:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid #bf562b}a{color:inherit;text-decoration:none}.plan-header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e1e5d7;padding-bottom:18px;font-size:11px;color:#64765e}.plan-header>span{font-size:9px;letter-spacing:2px}.plan-hero{display:grid;grid-template-columns:1.2fr 1fr;gap:55px;align-items:center;padding:35px 0}.eyebrow{font-size:10px;letter-spacing:1.5px;color:#71805f}h1{font-size:clamp(29px,3.5vw,44px);line-height:1.5;letter-spacing:-1px;margin:13px 0}h1 em{color:#be552d;font-style:normal}.plan-hero p,.overall-progress p{font-size:12px;color:#65735e}.overall-progress{border:1px solid #dde5d1;border-radius:14px;background:#f0f4e6;padding:24px}.overall-progress>strong{font:42px Georgia,serif}.overall-progress strong small{font:12px "Segoe UI","Microsoft YaHei",sans-serif;color:#64765a;margin-left:9px}.progress{height:5px;background:#dce5d0;border-radius:4px;margin:17px 0}.progress i{display:block;height:100%;background:#77925f}.overall-progress button,.primary,.empty-review button{background:#bd5229;color:white;border:1px solid #bd5229;padding:10px 16px;border-radius:7px;font-size:12px}.phase-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:30px}.phase-grid article{border:1px solid #e0e4d5;border-radius:12px;padding:21px;background:#fffef9}.phase-grid .current{border-color:#8a9d70;background:#f5f7ed}.phase-grid article>span{font-size:10px;color:#71805e}.phase-grid h2{font-size:18px;margin:10px 0}.phase-grid p{font-size:12px;color:#607057;min-height:66px}.phase-grid article>div{font-size:11px;color:#6b795f}.phase-grid button{border:0;background:transparent;color:#a74c2c;padding:13px 0 0;font-size:12px}.week-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:19px 0;border-block:1px solid #e3e6d9;font-size:12px}.week-toolbar select{min-height:40px;max-width:100%;padding:8px 30px 8px 12px;border:1px solid #cbd6c0;background:white;border-radius:7px;color:#2e4534}.week-toolbar>span{margin-left:auto;color:#6e7e60}.quiet{font-size:11px;border:0;color:#97613c;background:transparent;text-decoration:underline;flex-basis:100%;text-align:left;padding:5px 0}.week-title{display:flex;justify-content:space-between;align-items:center;gap:15px;padding:25px 0 15px}.week-title h2{font-size:23px;margin:5px 0}.checkpoint-badge{font-size:11px;padding:7px 12px;border:1px solid #d8c7a4;background:#fff7e7;border-radius:6px;color:#866437}.day-strip{display:grid;grid-template-columns:repeat(7,1fr);gap:9px}.day-strip button{display:flex;flex-direction:column;gap:6px;text-align:left;padding:13px;border-radius:9px;background:#fffef9;border:1px solid #e0e5d5;color:#63765a}.day-strip small{font-size:10px}.day-strip b{font-size:12px;font-weight:600}.day-strip span{font-size:10px}.day-strip .selected{border-color:#b7532e;background:#fff0e4;color:#984522}.day-strip .complete{box-shadow:inset 0 -3px #74935e}.today-header{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-top:29px}.today-header h2{font-size:22px;margin:6px 0}.today-header p{font-size:12px;color:#64725c}.save-label{font-size:10px;white-space:nowrap;color:#70815f;margin-bottom:16px}.task-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:10px 0 23px}.task-grid>button{display:flex;align-items:center;gap:11px;text-align:left;border:1px solid #dce3d0;border-radius:10px;padding:17px 15px;background:#fffef9;color:#2e4535}.task-grid>button>span{font:20px Georgia,serif;color:#a57a53}.task-grid h3{font-size:13px;margin:0 0 5px}.task-grid p{font-size:10px;color:#6d7c60;margin:0}.task-grid b{font-size:10px;margin-left:auto;white-space:nowrap;font-weight:500}.task-grid .active{border-color:#98ac7c;background:#f1f5e8}.task-grid .done>span{color:#628447}.activity{margin-top:20px}.empty-review,.weekly-check{border:1px solid #dae3ce;border-radius:12px;background:#fffef9;padding:25px}.empty-review p,.weekly-check>p{color:#607255;font-size:13px}.session-actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:15px 0;font-size:12px}.session-actions>span{color:#9b5738}.session-actions button,.plan-footer button{border:1px solid #d0ddbf;color:#516f3e;border-radius:6px;background:#f4f7eb;padding:9px 14px}.weekly-check h2{font-size:22px}.weekly-check label{display:flex;align-items:flex-start;gap:10px;margin:16px 0;font-size:13px}.weekly-check input{margin-top:6px;accent-color:#6c8c51}.weekly-check .reflection-label{display:block;font-size:12px}.weekly-check textarea{width:100%;padding:12px;border:1px solid #bdcda9;background:white;border-radius:7px;resize:vertical;color:#2e4633}.weekly-check .primary{margin-top:17px}.review-score{background:#f0f4e5;border-radius:7px;padding:11px 15px}.check-help{font-size:11px!important}.day-finished{display:flex;align-items:center;gap:20px;justify-content:space-between;margin-top:25px;padding:24px;background:#edf3e3;border:1px solid #d7e1ca;border-radius:12px}.day-finished span{font-size:12px;color:#5a7b44}.day-finished h3{font-size:20px;margin:7px 0}.day-finished p{font-size:12px;color:#65775b;margin:0}.day-finished button{white-space:nowrap;background:#67864e;color:white;border:0;border-radius:7px;padding:12px 17px}.plan-footer{border-top:1px solid #e1e7d6;margin-top:35px;padding-top:18px;color:#6a795f;font-size:11px}.plan-footer a{color:#9b5836;text-decoration:underline}.plan-footer button{margin-left:10px;font-size:10px}.load-error{padding:15px;background:#fff0e5;color:#9a4a30}.load-error button{margin-left:10px}@media(max-width:1000px){.task-grid{grid-template-columns:1fr}.task-grid>button{padding:14px 18px}.task-grid p{font-size:11px}.day-strip{gap:5px}.day-strip button{padding:12px 8px}.plan-hero{gap:25px}.phase-grid article{padding:17px}.phase-grid p{min-height:86px}}@media(max-width:650px){.plan-wrap{padding:18px 17px 45px}.plan-header>span{display:none}.plan-hero{grid-template-columns:1fr;gap:10px;padding:25px 0}.overall-progress{padding:18px}.phase-grid{grid-template-columns:1fr;gap:9px}.phase-grid article{padding:16px}.phase-grid p{min-height:0;margin:7px 0}.phase-grid h2{font-size:17px;margin:5px 0}.phase-grid article>span{font-size:10px}.phase-grid button{padding-top:7px}.week-toolbar>span{margin-left:0}.week-title h2{font-size:20px}.day-strip{display:flex;overflow:auto;padding-bottom:8px}.day-strip button{flex:0 0 92px}.today-header{display:block}.save-label{display:block;margin:9px 0}.today-header h2{font-size:20px}.day-finished{display:block}.day-finished button{margin-top:18px}.weekly-check{padding:18px}.checkpoint-badge{font-size:10px;padding:5px 8px;white-space:nowrap}}
</style>
