<script setup lang="ts">
import { computed, ref } from 'vue'
import curriculum from '@/data/dutch-curriculum.json'
import { useBaseStore } from '@/core/stores/base'
import { useSettingStore } from '@/core/stores/setting'
import { _getDictDataByUrl } from '@/core/utils'
import { getDefaultDict, type DictResource } from '@/core/types'
import { usePlayWordAudio } from '@/core/hooks/sound'
import { normalizeDutchInput } from '@/core/utils/dutch'
import { Toast } from '@/base'
import { getPracticeWordCacheLocal } from '@/core/utils/cache'
import { usePracticeWordPersistence } from '@/core/composables/practice-words/practice-word-session'
import { flushStatToStore } from '@/core/composables/usePracticePersistence'
import { WordPracticeMode } from '@/core/types/enum'
import Logo from '@/components/Logo.vue'

const store = useBaseStore()
const settings = useSettingStore()
const router = useRouter()
const play = usePlayWordAudio()
const persistence = usePracticeWordPersistence()
const busy = ref('')
const search = ref('')
const demoInput = ref('')
const demoIndex = ref(0)
const demoMode = ref('跟写')
const demo = [
  { word: 'goedemorgen', meaning: '早上好', sentence: 'Goedemorgen, hoe gaat het met je?', translation: '早上好，你最近怎么样？' },
  { word: 'de fiets', meaning: '自行车 · de-woord', sentence: 'Ik ga met de fiets naar mijn werk.', translation: '我骑自行车去上班。' },
  { word: 'alsjeblieft', meaning: '请；给你 · 非正式', sentence: 'Een kopje thee, alsjeblieft.', translation: '请给我一杯茶。' },
  { word: 'gezellig', meaning: '温馨的；愉快的', sentence: 'Wat een gezellige avond!', translation: '多么愉快的夜晚！' },
  { word: 'één', meaning: '一个（重读形式）', sentence: 'Eén koffie, alstublieft.', translation: '请来一杯咖啡。' },
]
const current = computed(() => demo[demoIndex.value])
const correct = computed(() => normalizeDutchInput(demoInput.value) === current.value.word)
const filtered = computed(() => curriculum.filter(pack => `${pack.name} ${pack.subtitle} ${pack.level}`.toLowerCase().includes(search.value.toLowerCase())))
const learned = computed(() => store.word.bookList.slice(3).reduce((sum, pack) => sum + (pack.complete ? pack.length : Math.min(pack.lastLearnIndex || 0, pack.length)), 0))
const today = computed(() => {
  const key = new Date().toLocaleDateString()
  return store.word.bookList.flatMap(pack => pack.statistics ?? [])
    .filter(stat => new Date(stat.startDate).toLocaleDateString() === key)
    .reduce((sum, stat) => sum + stat.new + stat.review, 0)
})
const goal = 10
const lessonProgress = (id: string) => {
  const pack = store.word.bookList.find(item => item.id === id)
  return pack ? pack.complete ? pack.length : pack.lastLearnIndex : 0
}
async function openPack(pack = curriculum[0]) {
  if (busy.value || !store.load) return
  busy.value = pack.id
  try {
    const saved = store.word.bookList.find(item => item.id === pack.id)
    const dict = await _getDictDataByUrl(pack as DictResource)
    if (store.sdict.id !== pack.id) {
      const cache = await getPracticeWordCacheLocal()
      if (cache) {
        flushStatToStore((cache as any).statStoreData)
        await persistence.clear()
      }
      if (![WordPracticeMode.Free, WordPracticeMode.System].includes(settings.wordPracticeMode)) {
        settings.wordPracticeMode = WordPracticeMode.System
      }
    }
    await store.changeDict(getDefaultDict({ ...dict, lastLearnIndex: saved?.lastLearnIndex ?? 0,
      complete: saved?.complete ?? false, perDayStudyNumber: saved?.perDayStudyNumber ?? 10 }))
    await router.push('/words')
  } catch {
    Toast.error('词库加载失败，请检查网络后重试。')
  } finally { busy.value = '' }
}
function continueStudy() {
  if (store.word.studyIndex >= 3) router.push('/words')
  else openPack()
}
function nextDemo() { demoIndex.value = (demoIndex.value + 1) % demo.length; demoInput.value = '' }
function setDemoMode(mode: string) { demoMode.value = mode; demoInput.value = ''; if (mode === '听写') play(current.value.word) }
useSeoMeta({ title: 'Type Dutch · 每天敲一点荷兰语', description: '为中文使用者设计的荷兰语入门练习。180 个主题词汇、双语对话、荷兰语发音与间隔复习。' })
</script>

<template>
  <div class="dutch-home">
    <header class="home-top"><Logo /><span class="edition">NEDERLANDS VOOR ELKE DAG</span><NuxtLink to="/help" class="quiet-link">学习指南 <span>↗</span></NuxtLink></header>
    <main class="home-main">
      <section class="intro-grid">
        <div class="intro-copy">
          <div class="eyebrow"><span class="flag"><i></i><i></i><i></i></span>从第一句 Hallo 开始</div>
          <h1>每天敲一点，<br>离荷兰语<span>近一点。</span></h1>
          <p class="intro-desc">听一遍，敲一遍，再记住一点。<br>用真实生活里的词和句子，慢慢把荷兰语变成日常。</p>
          <div class="intro-actions"><button class="primary-button" :disabled="!store.load || !!busy" @click="continueStudy">{{ busy ? '正在打开…' : store.word.studyIndex >= 3 ? '继续我的学习' : '开始第一课' }} <span>↗</span></button><NuxtLink to="/articles" class="text-button">练习生活对话 <span>→</span></NuxtLink></div>
          <div class="intro-foot"><span class="tiny-dot"></span> A1–A2 入门 <span>·</span> 中文释义 <span>·</span> 每天 10 个词</div>
        </div>
        <div class="demo-card">
          <div class="demo-top"><span><i class="live-dot"></i> 现在就试一试</span><span class="demo-count">{{ String(demoIndex + 1).padStart(2, '0') }} / 05</span></div>
          <div class="demo-tabs" role="group" aria-label="体验练习模式"><button v-for="mode in ['跟写', '听写', '默写']" :key="mode" :class="{ selected: demoMode === mode }" @click="setDemoMode(mode)">{{ mode }}</button></div>
          <div class="demo-word" lang="nl"><template v-if="demoMode === '跟写' || correct"><span v-for="(letter, i) in current.word" :key="i" :class="{ typed: demoInput[i] === letter, mistaken: demoInput[i] && demoInput[i] !== letter }">{{ letter }}</span></template><span v-else class="masked">{{ demoMode === '听写' ? '听一听，写下来' : '想一想，写下来' }}</span><button class="speak-button" aria-label="播放荷兰语发音" title="播放荷兰语发音" @click="play(current.word)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M11 5 6 9H3v6h3l5 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg></button></div>
          <div class="demo-meaning">{{ current.meaning }}</div>
          <label class="demo-input-label"><span class="sr-only">输入荷兰语单词</span><input v-model="demoInput" lang="nl" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="输入荷兰语单词" placeholder="在这里输入荷兰语…" :class="{ complete: correct }" @keydown.enter.prevent="correct ? nextDemo() : play(current.word)"/><span v-if="correct" class="success-mark">Goed zo! ✓</span></label>
          <div v-if="demoMode === '跟写' || correct" class="demo-example"><span lang="nl">{{ current.sentence }}</span><small>{{ current.translation }}</small></div><div v-else class="demo-example"><span>把听到的或记得的单词输入上方</span><small>需要提示时，切换回「跟写」</small></div>
          <div class="demo-bottom"><span>{{ correct ? '答对了！按 Enter 继续' : '荷兰语发音 · 点击喇叭试听' }}</span><button @click="nextDemo">下一个 <span>→</span></button></div>
        </div>
      </section>
      <section class="progress-strip" aria-label="学习概览">
        <div class="daily-progress"><div class="progress-ring" :style="{ '--progress': `${Math.min(today / goal, 1) * 100}%` }"><span>{{ Math.min(today, goal) }}<small>/{{ goal }}</small></span></div><div><strong>一点点，也算进步。</strong><p>今日已练习 {{ today }} 个词 · 目标 {{ goal }} 个</p></div></div>
        <div class="stat"><strong>{{ learned }}<small>/ 180</small></strong><span>已学词汇</span></div>
        <NuxtLink to="/words" class="stat stat-link"><strong>{{ store.wrong?.words?.length ?? 0 }}<small>个</small></strong><span>错词，值得再见一面 <b>↗</b></span></NuxtLink>
        <NuxtLink to="/setting?index=4" class="audio-tip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12h3v8H4zm13 0h3v8h-3z"/></svg><div>先听见，再记住<small>设置你的荷兰语语音 →</small></div></NuxtLink>
      </section>
      <section class="course-section">
        <div class="section-heading"><div><span class="section-kicker">JE EERSTE WOORDEN</span><h2>从生活里，认识荷兰语</h2><p>六个主题，每组 30 词。名词连同 de / het 一起学。</p></div><label class="course-search"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg><input v-model="search" aria-label="搜索主题词库" placeholder="找一个感兴趣的主题"/></label></div>
        <div class="course-grid"><button v-for="pack in filtered" :key="pack.id" class="course-card" :class="pack.color" :disabled="!!busy || !store.load" @click="openPack(pack)"><div class="course-card-top"><span class="course-number">{{ pack.icon }}</span><span class="level">{{ pack.level }}</span></div><span class="course-dutch" lang="nl">{{ pack.subtitle }}</span><h3>{{ pack.name }}</h3><p>{{ pack.description }}</p><div class="course-progress"><span :style="{ width: `${lessonProgress(pack.id) / pack.length * 100}%` }"></span></div><div class="course-card-bottom"><span>{{ lessonProgress(pack.id) }} / {{ pack.length }} 词</span><span class="course-arrow">{{ busy === pack.id ? '…' : '↗' }}</span></div></button></div>
        <p v-if="!filtered.length" class="empty-search">没有找到这个主题，试试“家庭”“交通”或“A1”。</p>
      </section>
      <section class="dialogue-banner"><div class="dialogue-art" aria-hidden="true"><span>“</span><b>Hoi!</b><i>Hallo.</i></div><div><span class="section-kicker">VAN WOORD NAAR GESPREK</span><h2>把单词，放进对话里。</h2><p>咖啡馆、火车站、看医生……8 段双语短对话，练习真正用得上的句子。</p></div><NuxtLink to="/articles">开始对话练习 <span>→</span></NuxtLink></section>
      <footer class="home-footer"><span>Rustig aan. Elke dag een beetje. <small>慢慢来，每天一点点。</small></span><a href="https://github.com/zyronon/TypeWords" target="_blank" rel="noopener noreferrer">基于 TypeWords · GPL-3.0</a><a href="https://github.com/KoalaLaw/Dutch" target="_blank" rel="noopener noreferrer">GitHub ↗</a></footer>
    </main>
  </div>
</template>

<style scoped>
.dutch-home{--ink:#253b37;--muted:#73817a;--line:#e6e7dc;--orange:#dc653b;background:#fafaf5;color:var(--ink);font-family:Inter,"Segoe UI","Microsoft YaHei",sans-serif;height:100%;overflow:auto;font-size:14px}
*{box-sizing:border-box}button,input{font:inherit}button,a,input{outline-offset:5px}button{cursor:pointer}button:disabled{opacity:.55;cursor:wait}a{text-decoration:none;color:inherit}button{color:inherit}button:focus-visible,a:focus-visible{outline:2px solid var(--orange)}
.home-top{max-width:1240px;margin:auto;display:flex;align-items:center;gap:24px;padding:25px 40px;border-bottom:1px solid var(--line)}.edition{font-size:9px;letter-spacing:2px;color:#8d978e}.quiet-link{margin-left:auto;font-size:12px;color:#63756b}.quiet-link span{margin-left:12px}.home-main{max-width:1240px;margin:auto;padding:0 40px}.intro-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:65px;padding:60px 0 46px;align-items:center}.eyebrow{display:flex;gap:10px;align-items:center;color:#7d7c63;font-size:12px;letter-spacing:1px}.flag{display:flex;flex-direction:column;width:20px;height:14px;border:1px solid #d6d8d0;transform:rotate(-4deg)}.flag i{height:33.333%;background:#bc4743}.flag i:nth-child(2){background:white}.flag i:last-child{background:#304d72}h1{font-size:clamp(30px,3.2vw,48px);font-weight:650;line-height:1.5;letter-spacing:-1.5px;margin:17px 0}h1>span{color:var(--orange)}.intro-desc{line-height:2;color:#7a847b;font-size:13px;margin:12px 0 25px}.intro-actions{display:flex;align-items:center;gap:23px}.primary-button{display:flex;align-items:center;gap:30px;background:var(--orange);color:white;border:0;border-radius:7px;padding:13px 22px;font-weight:600;box-shadow:0 4px 9px #dc653b12}.primary-button:hover{background:#c65630}.text-button{font-size:12px;font-weight:500}.text-button span{margin-left:10px}.intro-foot{font-size:10px;display:flex;gap:11px;align-items:center;color:#8e9485;margin-top:19px}.tiny-dot{background:#6f907c;width:5px;height:5px;border-radius:50%}
.demo-card{background:#fffefa;border:1px solid #e4e5d9;border-radius:13px;box-shadow:0 10px 40px #384f3410;transform:rotate(1deg);overflow:hidden;position:relative}.demo-top{padding:17px 23px;border-bottom:1px solid #eeeee4;display:flex;justify-content:space-between;font-size:11px;color:#738074}.demo-top>span:first-child{display:flex;align-items:center;gap:8px}.live-dot{width:6px;height:6px;background:#7d9471;border-radius:50%}.demo-count{font-family:monospace;letter-spacing:1px}.demo-tabs{display:flex;margin:21px 23px 0;background:#f1f2eb;padding:3px;border-radius:6px;width:fit-content;gap:3px}.demo-tabs button{border:0;background:transparent;padding:5px 16px;border-radius:4px;font-size:10px;color:#8c9286}.demo-tabs .selected{background:#fffefa;color:var(--ink);box-shadow:0 1px 3px #0000000c}.demo-word{display:flex;align-items:center;white-space:pre;margin:25px 23px 0;font-size:clamp(24px,2.6vw,35px);font-family:Consolas,monospace;letter-spacing:-1px;color:#a5ad9b;font-weight:500}.demo-word .typed{color:#528261}.demo-word .mistaken{color:#cc5041;background:#fbe8e2}.demo-word .masked{font-family:inherit;font-size:22px;letter-spacing:0}.speak-button{margin-left:auto;width:32px;height:32px;display:grid;place-items:center;border:0;background:#edf1e9;color:#66806c;border-radius:50%;padding:7px;flex-shrink:0}.speak-button svg{width:19px;height:19px}.demo-meaning{font-size:11px;color:#8a9082;padding:8px 23px}.demo-input-label{display:block;margin:13px 23px 0;position:relative}.demo-input-label input{background:#f8f9f2;border:1px solid #e5e7da;border-radius:6px;padding:12px;width:100%;font-size:13px;letter-spacing:.5px;color:#3e5d48}.demo-input-label input::placeholder{font-size:11px;color:#abb0a0}.demo-input-label input.complete{border-color:#97b697}.success-mark{position:absolute;right:10px;top:13px;font-size:10px;color:#67866a;pointer-events:none}.demo-example{margin:19px 23px;color:#7c8575;font-size:11px;display:flex;flex-direction:column;gap:6px;line-height:1.5}.demo-example small{font-size:10px;color:#a1a793}.demo-bottom{border-top:1px dashed #e6e7db;display:flex;justify-content:space-between;align-items:center;padding:14px 23px;font-size:9px;color:#929b87}.demo-bottom button{border:0;background:transparent;font-size:10px;color:#65785f}.demo-bottom button>span{padding-left:12px}
.progress-strip{display:grid;grid-template-columns:1.6fr .7fr 1fr 1.1fr;border:1px solid var(--line);border-radius:9px;background:#f3f5ed;padding:23px 25px;gap:20px;align-items:center}.daily-progress{display:flex;align-items:center;gap:14px}.progress-ring{background:conic-gradient(#7e9870 var(--progress),#e3e8db 0);width:44px;height:44px;border-radius:50%;padding:4px}.progress-ring>span{width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:#f3f5ed;border-radius:50%;font-size:14px;font-weight:700}.progress-ring small{font-size:8px;margin-top:4px;color:#8a977f}.daily-progress strong{font-size:12px;font-weight:600}.daily-progress p{font-size:10px;color:#929b86;margin:6px 0 0}.stat{display:flex;flex-direction:column;border-left:1px solid #dfe4d5;padding-left:23px;gap:6px}.stat strong{font-size:24px;font-weight:500;font-family:Georgia,serif}.stat small{font-family:inherit;font-size:10px;color:#949e89;margin-left:6px}.stat>span{font-size:10px;color:#87937e}.stat b{font-weight:normal;margin-left:8px}.stat-link:hover{color:var(--orange)}.audio-tip{display:flex;align-items:center;gap:10px;font-size:11px;justify-content:flex-end}.audio-tip svg{width:26px;height:26px;color:#8b9c78}.audio-tip small{display:block;margin-top:6px;color:#929b86;font-size:9px}
.course-section{padding:48px 0 32px}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:25px;gap:20px}.section-kicker{font-size:9px;color:#98a28e;letter-spacing:2px}.section-heading h2,.dialogue-banner h2{font-size:23px;font-weight:600;letter-spacing:-.7px;margin:9px 0}.section-heading p,.dialogue-banner p{color:#939a89;font-size:11px;margin:9px 0 0;line-height:1.8}.course-search{display:flex;align-items:center;gap:7px;border-bottom:1px solid #daddcf;padding:9px 0;margin-bottom:3px}.course-search svg{width:16px;height:16px;color:#929c83}.course-search input{width:165px;border:0;background:transparent;font-size:11px;outline-offset:6px;color:var(--ink)}.course-search input::placeholder{color:#9fa68e}.course-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.course-card{background:#fffefa;border:1px solid #e3e6d9;border-radius:9px;text-align:left;padding:21px 23px;transition:transform .18s,box-shadow .18s}.course-card:hover{transform:translateY(-3px);box-shadow:0 5px 20px #263f3010}.course-card-top{display:flex;align-items:center;justify-content:space-between}.course-number{display:grid;place-items:center;width:37px;height:37px;background:#f5e0d2;color:#b7754d;font-size:15px;font-family:Georgia,serif;border-radius:10px}.level{font-size:9px;border:1px solid #e6e7db;border-radius:4px;padding:3px 7px;color:#8b937f}.sage .course-number{background:#e3ebdd;color:#778a68}.butter .course-number{background:#f5edce;color:#a38f42}.sky .course-number{background:#dce9e9;color:#688e93}.lavender .course-number{background:#e8e3ed;color:#94819b}.sand .course-number{background:#eae6d9;color:#92856b}.course-dutch{display:block;font-family:Georgia,serif;font-style:italic;color:#a6ab98;font-size:13px;margin-top:24px}.course-card h3{font-size:17px;font-weight:600;margin:7px 0 10px;letter-spacing:-.5px}.course-card p{font-size:10px;line-height:1.7;color:#969d8b;margin:0;min-height:34px}.course-progress{height:3px;background:#eef0e6;margin-top:18px;border-radius:2px}.course-progress span{display:block;height:100%;background:#8ba67d}.course-card-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:11px;color:#a5ad96;font-size:9px}.course-arrow{font-size:17px;color:#7b8b6e}.empty-search{padding:40px;text-align:center;color:#73817a}
.dialogue-banner{margin:0 0 32px;background:#eef1e7;border-radius:9px;padding:24px 28px;display:flex;gap:28px;align-items:center}.dialogue-art{width:90px;height:75px;position:relative;flex-shrink:0}.dialogue-art>span{font-family:Georgia,serif;font-size:100px;color:#d9e1ce;position:absolute;left:0;top:-12px}.dialogue-art b,.dialogue-art i{position:absolute;padding:8px 13px;font-family:Georgia,serif;font-weight:normal;font-style:italic;font-size:15px;transform:rotate(-7deg);background:#fbfbf3;border-radius:8px 8px 8px 0;left:0;top:0;color:#7d906c;box-shadow:0 2px 6px #00000004}.dialogue-art i{left:25px;top:35px;background:#dce6cf;transform:rotate(7deg);color:#738362;border-radius:8px 8px 0 8px}.dialogue-banner h2{font-size:20px;margin:6px 0}.dialogue-banner p{font-size:10px}.dialogue-banner>a{margin-left:auto;font-size:11px;white-space:nowrap;padding:10px 15px;background:#fbfcf6;border:1px solid #dfe5d4;border-radius:6px}.dialogue-banner>a span{margin-left:10px}.home-footer{padding:0 0 25px;display:flex;align-items:center;gap:20px;color:#a3ab97;font-size:9px}.home-footer>span{font-family:Georgia,serif;font-style:italic;font-size:11px;margin-right:auto}.home-footer small{font-family:"Segoe UI","Microsoft YaHei",sans-serif;font-size:9px;font-style:normal;margin-left:8px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(min-width:1600px){.intro-grid{padding-top:75px;padding-bottom:60px}.demo-card{margin:0 8px}.course-card{padding:26px}.course-section{padding-top:55px}}
@media(max-width:1100px){.home-top{padding:22px 28px}.home-main{padding:0 28px}.intro-grid{gap:28px;padding:40px 0}.intro-actions{gap:15px}.progress-strip{grid-template-columns:1.4fr .7fr 1fr;gap:15px;padding:20px}.audio-tip{display:none}.course-card{padding:18px}.edition{display:none}.home-footer small{display:none}}
@media(max-width:760px){.home-top{padding:17px 20px}.home-main{padding:0 20px}.intro-grid{grid-template-columns:1fr;gap:28px;padding:30px 0}.intro-copy{text-align:left}h1{font-size:36px}.intro-desc{font-size:12px}.demo-card{transform:none}.demo-word{font-size:32px}.progress-strip{grid-template-columns:1fr 1fr;gap:17px;padding:18px}.daily-progress{grid-column:1/-1}.stat{padding-left:0;border:0}.course-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.course-card{padding:16px}.course-card h3{font-size:15px}.course-dutch{font-size:12px}.section-heading{display:block}.course-search{margin-top:18px;width:100%}.course-search input{width:100%}.course-section{padding:32px 0 25px}.section-heading h2{font-size:21px}.dialogue-banner{padding:20px;gap:15px;flex-wrap:wrap}.dialogue-art{display:none}.dialogue-banner>a{margin-left:0}.home-footer{flex-wrap:wrap;gap:10px}.home-footer>span{width:100%;font-size:11px}.course-card p{min-height:35px}}
@media(prefers-reduced-motion:reduce){.course-card{transition:none}.course-card:hover{transform:none}}
</style>
