<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import curriculum from '@/data/dutch-curriculum.json'
import plan from '@/data/daily-plan.json'
import { useDailyLearning, loadDailyWords } from '@/core/composables/useDailyLearning'
import { useSettingStore } from '@/core/stores/setting'
import { WordPracticeMode } from '@/core/types/enum'
import { usePlayWordAudio } from '@/core/hooks/sound'
import { lookupWord } from '@/core/hooks/useWordLookup'
import WordLookupPopover from '@/components/word/WordLookupPopover.vue'
import { normalizeDutchInput } from '@/core/utils/dutch'
import { _getDictDataByUrl } from '@/core/utils'
import { getPracticeWordCacheLocal } from '@/core/utils/cache'
import { flushStatToStore, usePracticeWordPersistence } from '@/core/composables/usePracticePersistence'
import { getDefaultDict } from '@/core/types/func'
import type { Word, DictResource } from '@/core/types'
import { Toast } from '@/base'
const route=useRoute(),router=useRouter(),daily=useDailyLearning(),speak=usePlayWordAudio(),persistence=usePracticeWordPersistence()
const settings=useSettingStore()
const words=shallowRef<Word[]>([]),search=ref(''),stage=ref('all'),expanded=ref(''),busy=ref(''),error=ref('')
const stages=[{id:'all',label:'全部 72 主题'},{id:'foundation',label:'A1–A2 基础 · 18 主题'},{id:'bridge',label:'A2 进阶 · 24 主题'},{id:'b1',label:'B1 综合 · 30 主题'}]
const orderedIds=plan.weeks.flatMap(week=>week.packIds)
const ordered=[...curriculum].sort((a,b)=>orderedIds.indexOf(a.id)-orderedIds.indexOf(b.id))
const matches=computed(()=>{
 const query=normalizeDutchInput(search.value)
 return ordered.filter(pack=>{
  if(stage.value!=='all'&&(stage.value==='progression'?pack.stage==='foundation':pack.stage!==stage.value))return false
  return !query||normalizeDutchInput(`${pack.title} ${pack.subtitle} ${pack.description}`).includes(query)||words.value.some(word=>word.id.startsWith(pack.id+'-')&&normalizeDutchInput(word.word+' '+word.trans.map(item=>item.cn).join(' ')).includes(query))
 })
})
function packWords(id:string){return words.value.filter(word=>word.id.startsWith(id+'-'))}
function lessons(id:string){return plan.days.filter(day=>day.packId===id)}
function progress(id:string){const book=daily.store.word.bookList.find(item=>item.id===id);const done=new Set(packWords(id).slice(0,book?.complete?30:book?.lastLearnIndex||0).map(word=>word.id));for(const word of packWords(id))if(daily.state.value.words[word.id]||daily.store.fsrsData[word.word])done.add(word.id);return done.size}
async function load(){error.value='';try{words.value=await loadDailyWords()}catch{error.value='完整词表加载失败，主题仍可按日计划打开。'}}
async function freePractice(pack:(typeof curriculum)[number]){
 if(busy.value||!daily.store.load)return
 busy.value=pack.id
 try{
  const saved=daily.store.word.bookList.find(item=>item.id===pack.id)
  if(daily.store.sdict.id!==pack.id){const cache=await getPracticeWordCacheLocal();if(cache){flushStatToStore((cache as any).statStoreData);await persistence.clear()};if(![WordPracticeMode.Free,WordPracticeMode.System].includes(settings.wordPracticeMode))settings.wordPracticeMode=WordPracticeMode.System}
  const data=await _getDictDataByUrl(pack as DictResource)
  await daily.store.changeDict(getDefaultDict({...data,lastLearnIndex:saved?.lastLearnIndex??0,complete:saved?.complete??false,perDayStudyNumber:saved?.perDayStudyNumber??10}))
  await router.push('/words')
 }catch{Toast.error('词库加载失败，请稍后重试')}finally{busy.value=''}
}
watch(()=>[route.query.stage,route.query.topic],()=>{const value=String(route.query.stage||'all');if(stages.some(item=>item.id===value)||value==='progression')stage.value=value;expanded.value=String(route.query.topic||'');const focused=curriculum.find(item=>item.id===expanded.value);if(focused){search.value=focused.title;stage.value=focused.stage}},{immediate:true})
onMounted(load)
useSeoMeta({title:'Type Dutch · 72个词汇主题',description:'2160条荷兰语词汇与搭配，按A1到B1划分72个主题，每主题3个10词小节。'})
</script>
<template>
 <main class="vocabulary-page"><div class="vocabulary-wrap"><header><NuxtLink to="/">← 学习首页</NuxtLink><NuxtLink to="/plan">按天继续学习 →</NuxtLink></header>
  <div class="library-intro"><span>WOORDEN IN JE DAGELIJKS LEVEN</span><h1>72 个主题，<br><em>让词汇有地方可去。</em></h1><p>2,160 条词汇与搭配，每个主题分成 3 个 10 词小节。可以跟随日计划，也可以自由选题复习。</p><div class="library-facts"><b>18 个基础主题</b><b>24 个 A2 进阶主题</b><b>30 个 B1 综合主题</b></div></div>
  <section class="library-controls"><div role="group" aria-label="词汇阶段"><button v-for="item in stages" :key="item.id" :class="{active:stage===item.id}" :aria-pressed="stage===item.id" type="button" @click="stage=item.id">{{ item.label }}</button></div><label><span>搜索主题、荷兰语或中文</span><input v-model="search" placeholder="例如：住房 / afspraak / 工作" aria-label="搜索主题和词汇"/></label></section>
  <p class="match-count">找到 {{ matches.length }} 个主题 · 已有记录和错词保留。<NuxtLink to="/words">打开原有自由练习与词典 ↗</NuxtLink></p><p v-if="error" role="alert">{{ error }} <button @click="load">重试</button></p>
  <section class="topic-grid"><article v-for="pack in matches" :key="pack.id" :class="{expanded:expanded===pack.id}"><div class="topic-head"><span>{{ String(orderedIds.indexOf(pack.id)+1).padStart(2,'0') }}</span><small>{{ pack.level }}</small></div><p class="subtitle" lang="nl">{{ pack.subtitle }}</p><h2>{{ pack.name }}</h2><p class="description">{{ pack.description }}</p><div class="topic-progress"><i :style="{width:progress(pack.id)/30*100+'%'}"/></div><div class="progress-caption"><span>{{ progress(pack.id) }} / 30 条有练习记录</span><span>3 个小节</span></div><div class="lesson-links"><NuxtLink v-for="(lesson,i) in lessons(pack.id)" :key="lesson.id" :to="'/plan?day='+lesson.id">小节 {{ i+1 }} <small>第 {{ lesson.number }} 天</small></NuxtLink></div><div class="topic-actions"><button type="button" @click="expanded=expanded===pack.id?'':pack.id">{{ expanded===pack.id?'收起词表':'看这 30 条词表' }}</button><button type="button" :disabled="!!busy||!daily.store.load" @click="freePractice(pack)">{{ busy===pack.id?'加载中…':'自由练习 ↗' }}</button></div><div v-if="expanded===pack.id" class="word-list"><p v-if="!words.length">正在加载完整词表…</p><div v-for="word in packWords(pack.id)" :key="word.id"><button type="button" lang="nl" @click="lookupWord($event,word.word,speak)">{{ word.word }}</button><span>{{ word.trans.map(item=>item.cn).join('；') }}</span><button type="button" :aria-label="'播放 '+word.word+' 的荷兰语发音'" @click="speak(word.word,false)">▶</button></div></div></article></section>
  <p v-if="!matches.length" class="no-matches">没有匹配的主题，试试更短的关键词，或切换到“全部”。</p><footer><p>学习记录保存在当前浏览器，换设备前可到设置导出备份。词汇数量是材料范围，不直接等同于 B1 水平。</p><NuxtLink to="/plan">不知道先学哪一个？打开今天的三项任务 →</NuxtLink></footer><WordLookupPopover/>
 </div></main>
</template>
<style scoped>
.vocabulary-page{height:100%;overflow:auto;background:#fafaf4;color:#2a4135;font:14px/1.8 "Segoe UI","Microsoft YaHei",sans-serif}.vocabulary-wrap{max-width:1210px;margin:auto;padding:25px 36px 55px;box-sizing:border-box}*{box-sizing:border-box}a{color:inherit;text-decoration:none}button,input{font:inherit}button{cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible,a:focus-visible,input:focus-visible{outline:2px solid #bb552e;outline-offset:4px}header{display:flex;justify-content:space-between;gap:20px;font-size:11px;color:#64775d;padding-bottom:18px;border-bottom:1px solid #e0e6d6}.library-intro{padding:35px 0 25px}.library-intro>span{font-size:9px;letter-spacing:2px;color:#748161}h1{font-size:clamp(29px,3.5vw,42px);line-height:1.5;letter-spacing:-1px;margin:13px 0}h1 em{font-style:normal;color:#bb552e}.library-intro p{color:#65735b;font-size:13px}.library-facts{display:flex;flex-wrap:wrap;gap:11px;margin-top:22px}.library-facts b{font-size:11px;font-weight:500;border:1px solid #dbe4cf;padding:7px 12px;border-radius:6px;background:#f1f5e7}.library-controls{display:flex;gap:25px;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;border-block:1px solid #e1e6d7;padding:20px 0}.library-controls>div{display:flex;gap:8px;flex-wrap:wrap}.library-controls button{border:1px solid #d5dfc9;padding:9px 13px;border-radius:20px;background:#fffef9;color:#596f49;font-size:11px}.library-controls .active{background:#e7efdb;border-color:#91a974;color:#3b5f2f}.library-controls label{display:flex;flex-direction:column;gap:7px;font-size:10px;color:#617558}.library-controls input{padding:10px 13px;min-width:250px;border:1px solid #c6d2b7;border-radius:7px;background:white;font-size:12px;color:#29442f}.match-count{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;margin:19px 0;color:#69795f;font-size:11px}.match-count a{color:#9c5839}.topic-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px}.topic-grid article{padding:21px;background:#fffef9;border:1px solid #dfe5d4;border-radius:12px;align-self:start}.topic-head{display:flex;justify-content:space-between;align-items:center}.topic-head>span{display:grid;place-items:center;width:36px;height:36px;border-radius:9px;background:#efe5d6;color:#a16d44;font:17px Georgia,serif}.topic-head small{color:#697b5c;border:1px solid #dfe6d5;border-radius:5px;padding:2px 7px;font-size:10px}.subtitle{font:italic 13px Georgia,serif;color:#75866a;margin:22px 0 8px}h2{font-size:19px;margin:7px 0 12px}.description{font-size:12px;color:#64745b;min-height:45px;margin-bottom:17px}.topic-progress{height:3px;background:#e8eddf;border-radius:3px}.topic-progress>i{display:block;height:100%;background:#839f68}.progress-caption{display:flex;justify-content:space-between;font-size:10px;color:#718260;margin:10px 0 16px}.lesson-links{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.lesson-links a{text-align:center;border:1px solid #d7e2c9;background:#f4f7ec;border-radius:6px;font-size:11px;padding:9px 3px}.lesson-links small{display:block;font-size:9px;color:#6c7e5b;margin-top:3px}.topic-actions{display:flex;justify-content:space-between;gap:9px;margin-top:13px}.topic-actions button{font-size:10px;color:#936442;border:0;border-bottom:1px solid #dbc8af;padding:7px 0;background:transparent}.word-list{border-top:1px solid #e0e7d6;margin-top:17px;padding-top:8px}.word-list>div{display:grid;grid-template-columns:1.1fr 1fr 24px;gap:8px;padding:11px 0;border-bottom:1px solid #edf0e5;align-items:start}.word-list button{font-size:12px;text-align:left;color:#385e3c;background:transparent;border:0;padding:0;overflow-wrap:anywhere}.word-list span{font-size:11px;color:#65785b}.word-list button:last-child{text-align:right;font-size:10px}.expanded{border-color:#90a572!important}.no-matches{padding:30px;text-align:center;color:#687c5c}footer{margin-top:30px;border-top:1px solid #e1e7d7;padding-top:18px;font-size:11px;color:#687a5d}footer>a{display:inline-block;color:#a15a34;margin-top:8px}@media(max-width:1000px){.topic-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.library-controls{gap:15px}.library-controls label{width:100%}.library-controls input{width:100%}}@media(max-width:650px){.vocabulary-wrap{padding:18px 17px 40px}.topic-grid{grid-template-columns:1fr}.library-intro{padding-top:26px}.topic-grid article{padding:19px}.description{min-height:0}.library-controls input{min-width:0}.library-controls button{font-size:10px;padding:8px 10px}}
</style>
