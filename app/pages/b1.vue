<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import skills from '@/data/b1-skills.json'
import readings from '@/data/b1-readings.json'
import summary from '@/data/course-summary.json'
import { useBaseStore } from '@/core/stores/base'
import { useTTsPlayAudio, cancelWordPracticeAudio } from '@/core/hooks/sound'
import { B1_STATE_KEY, parseB1State, countDutchWords, isWritingReady, type B1PracticeState } from '@/core/utils/b1-learning'
import { _getDictDataByUrl, resourceWrap } from '@/core/utils'
import { DictType } from '@/core/types/enum'
import { DICT_LIST } from '@/core/config/env'
import { getPracticeArticleCacheLocal } from '@/core/utils/cache'
import { usePracticeArticlePersistence } from '@/core/composables/usePracticePersistence'
import { Toast } from '@/base'

const store = useBaseStore()
const route = useRoute()
const router = useRouter()
const speak = useTTsPlayAudio()
const articlePersistence = usePracticeArticlePersistence()
const tabs = [
  { id:'route', label:'学习路线' }, { id:'grammar', label:'语法与句型' },
  { id:'reading', label:'阅读理解' }, { id:'writing', label:'写作训练' }, { id:'speaking', label:'口语任务' },
]
const tab = computed(() => tabs.some(item => item.id === route.query.tab) ? String(route.query.tab) : 'route')
const grammarId = ref(skills.grammarUnits[0].id)
const writingId = ref(skills.writingTasks[0].id)
const speakingId = ref(skills.speakingTasks[0].id)
const readingId = ref(readings[0].id)
const grammar = computed(() => skills.grammarUnits.find(item => item.id === grammarId.value)!)
const writing = computed(() => skills.writingTasks.find(item => item.id === writingId.value)!)
const speaking = computed(() => skills.speakingTasks.find(item => item.id === speakingId.value)!)
const reading = computed(() => readings.find(item => item.id === readingId.value)!)
const practice = computed(() => parseB1State(store.noteData?.[B1_STATE_KEY]))
const showTranslation = ref(false)
const showModel = ref(false)
const opening = ref(false)
const countdown = ref(0)
const timerPhase = ref('')
let interval: ReturnType<typeof setInterval> | undefined

function update(change: (state: B1PracticeState) => void) {
  if (!store.load) return
  const state = parseB1State(store.noteData?.[B1_STATE_KEY])
  change(state)
  store.noteData[B1_STATE_KEY] = JSON.stringify(state)
}
function chooseTab(id: string) { router.replace({ path:'/b1', query:{ tab:id } }) }
function answer(key: string, index: number) { update(state => { state.answers[key] = index }) }
function checks(id: string) { return practice.value.checks[id] ?? [] }
function check(id: string, index: number, enabled: boolean) {
  update(state => {
    const values = new Set(state.checks[id] ?? [])
    enabled ? values.add(index) : values.delete(index)
    state.checks[id] = [...values]
    delete state.completed[id]
  })
}
const draft = computed(() => practice.value.drafts[writing.value.id] ?? '')
const notes = computed(() => practice.value.speakingNotes[speaking.value.id] ?? '')
const words = computed(() => countDutchWords(draft.value))
const writingReady = computed(() => isWritingReady(draft.value, checks(writing.value.id), writing.value.minWords, writing.value.maxWords, writing.value.checklist.length))
function saveDraft(text: string) { update(state => { state.drafts[writing.value.id] = text; delete state.completed[writing.value.id] }) }
function saveNotes(text: string) { update(state => { state.speakingNotes[speaking.value.id] = text; delete state.completed[speaking.value.id] }) }
function complete(id: string) { update(state => { state.completed[id] = true }) }
const grammarPassed = computed(() => skills.grammarUnits.filter(unit => unit.exercises.every((exercise, index) => practice.value.answers[`g:${unit.id}:${index}`] === exercise.answer)).length)
const readingPassed = computed(() => readings.filter(item => item.questions.every((question, index) => practice.value.answers[`r:${item.id}:${index}`] === question.correctAnswer[0].charCodeAt(0) - 97)).length)
const writingDone = computed(() => skills.writingTasks.filter(item => practice.value.completed[item.id]).length)
const speakingDone = computed(() => skills.speakingTasks.filter(item => practice.value.completed[item.id]).length)
const grammarScore = computed(() => grammar.value.exercises.filter((exercise,index) => practice.value.answers[`g:${grammar.value.id}:${index}`] === exercise.answer).length)
function resetGrammar() {
  update(state => { for (const key of Object.keys(state.answers)) if (key.startsWith(`g:${grammar.value.id}:`)) delete state.answers[key] })
}
function stopTimer() { clearInterval(interval); interval = undefined }
function startTimer() {
  stopTimer()
  timerPhase.value = '准备'
  countdown.value = speaking.value.prepSeconds
  interval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (timerPhase.value === '准备') { timerPhase.value = '表达'; countdown.value = speaking.value.speakSeconds }
      else { stopTimer(); countdown.value = 0; timerPhase.value = '练习结束，完成下方自检' }
    }
  }, 1000)
}
watch([tab, grammarId, writingId, speakingId, readingId], () => {
  stopTimer(); timerPhase.value = ''; countdown.value = 0; showModel.value = false; showTranslation.value = false
  cancelWordPracticeAudio()
})
onUnmounted(() => { stopTimer(); cancelWordPracticeAudio() })

async function openReading() {
  if (opening.value || !store.load) return
  opening.value = true
  try {
    const response = await fetch(resourceWrap(DICT_LIST.ARTICLE.ALL))
    if (!response.ok) throw new Error('Book list unavailable')
    const books = await response.json()
    const book = books.find(item => item.id === 'nl-b1-reading')
    if (!book) throw new Error('B1 book unavailable')
    const loaded = await _getDictDataByUrl(book, DictType.article)
    const cache = await getPracticeArticleCacheLocal()
    if (cache) {
      const stats = cache.statStoreData
      if (stats?.spend && store.sbook.id) {
        const currentArticle = store.sbook.articles[store.sbook.lastLearnIndex]
        store.sbook.statistics.push({ title:currentArticle?.title, startDate:stats.startDate,
          spend:stats.spend, total:stats.total, wrong:stats.wrong, new:0, review:0 })
      }
      await articlePersistence.clear()
    }
    await store.changeBook(loaded)
    store.sbook.lastLearnIndex = readings.findIndex(item => item.id === reading.value.id)
    await router.push('/practice-articles/nl-b1-reading')
  } catch { Toast.error('阅读材料加载失败，请稍后重试。') }
  finally { opening.value = false }
}
useSeoMeta({ title:'Type Dutch · B1 学习中心', description:'面向 B1 目标的荷兰语词汇、语法、阅读、写作和口语练习。' })
</script>

<template>
  <main class="b1-page">
    <header class="b1-header"><NuxtLink to="/">← 词汇首页</NuxtLink><span>STAP VOOR STAP NAAR B1</span></header>
    <section class="b1-intro"><span class="target-tag">你的目标 · B1</span><h1>把会的词，变成想说的话。</h1><p>理解长一点的内容，讲清经历和理由，写出有联系的句子。每天给不同的能力留一点练习时间。</p></section>
    <div class="skill-counts"><span><b>{{ summary.wordCount }}</b>词汇与搭配</span><span><b>{{ grammarPassed }} / {{ summary.grammarCount }}</b>语法单元答对</span><span><b>{{ readingPassed }} / {{ summary.readingCount }}</b>阅读题答对</span><span><b>{{ writingDone }} / {{ summary.writingCount }}</b>写作自评已练习</span><span><b>{{ speakingDone }} / {{ summary.speakingCount }}</b>口语自评已练习</span></div>
    <nav class="b1-tabs" aria-label="B1 训练内容"><button v-for="item in tabs" :key="item.id" :aria-pressed="tab === item.id" :class="{active:tab === item.id}" @click="chooseTab(item.id)">{{ item.label }}</button></nav>
    <div v-if="!store.load" class="loading-note" role="status">正在读取你的练习记录…</div>
    <section v-if="tab === 'route'" class="route-panel">
      <div class="route-heading"><h2>一条覆盖词汇、理解和表达的路线</h2><p>基础薄弱时先补 A2；已经能处理简单日常交流，可以直接从 B1 专题开始。</p></div>
      <div class="route-grid">
        <NuxtLink class="route-card" to="/?stage=foundation"><span>01 / 巩固基础</span><h3>A1–A2 查漏补缺</h3><p>保留原来的 180 个词与 8 段短对话。复习常见动词、冠词和基本语序。</p><b>打开基础词库 →</b></NuxtLink>
        <NuxtLink class="route-card accent" to="/?stage=progression"><span>02 / 扩大表达范围</span><h3>{{ summary.progressionCount }} 条进阶词汇与搭配</h3><p>工作、住房、学习、社会、环境、观点与连接词。把词语放进带语境的句子里练。</p><b>打开 A2→B1 词库 →</b></NuxtLink>
        <button class="route-card" @click="chooseTab('grammar')"><span>03 / 连起句子</span><h3>{{ summary.grammarCount }} 个语法单元 · {{ summary.grammarExerciseCount }} 题</h3><p>从句、完成时、过去时、关系代词和语序。看例句、做选择题，再自己造句。</p><b>开始语法练习 →</b></button>
        <button class="route-card" @click="chooseTab('reading')"><span>04 / 理解与复述</span><h3>{{ summary.readingCount }} 篇 B1 阅读 · {{ summary.readingQuestionCount }} 题</h3><p>每篇约 180–220 词。先读荷兰语，找主旨与细节，再看译文，最后复述。</p><b>打开阅读任务 →</b></button>
        <button class="route-card" @click="chooseTab('writing')"><span>05 / 写清一件事</span><h3>{{ summary.writingCount }} 个真实场景写作任务</h3><p>预约、投诉、申请、描述经历和表达观点。写 100–150 词，再对照范文与清单。</p><b>开始写作 →</b></button>
        <button class="route-card" @click="chooseTab('speaking')"><span>06 / 说出自己的意思</span><h3>{{ summary.speakingCount }} 个口语任务</h3><p>准备 30 秒，表达 90 秒。练习说明原因、提供例子、礼貌提问和回应对方。</p><b>开始口语练习 →</b></button>
      </div>
      <div class="routine"><h3>一次练习，可以这样安排</h3><p>复习旧词 → 10 个新词或搭配 → 1 个语法单元 → 选 1 篇阅读或 1 个表达任务。读完一篇文章后，用自己的话说出主旨、一个细节和你的看法。</p></div>
      <p class="scope-note">词汇数量和任务完成数用于记录练习。B1 是综合语言能力目标，需在真实听、说、读、写中检验；这里的级别是内容路线标签，不是官方考试词表或能力认证。</p>
    </section>

    <section v-else-if="tab === 'grammar'" class="practice-panel">
      <label class="task-picker">选择语法单元<select v-model="grammarId"><option v-for="(unit,index) in skills.grammarUnits" :key="unit.id" :value="unit.id">{{ String(index+1).padStart(2,'0') }} · {{ unit.title }}</option></select></label>
      <div class="task-heading"><div><span class="eyebrow">GRAMMATICA</span><h2>{{ grammar.title }}</h2><p lang="nl">{{ grammar.subtitle }}</p></div><span class="score">{{ grammarScore }} / {{ grammar.exercises.length }} 题答对</span></div>
      <p class="explanation">{{ grammar.explanation }}</p><div class="pattern">{{ grammar.pattern }}</div>
      <div class="examples"><button v-for="example in grammar.examples" :key="example.nl" @click="speak(example.nl)" :aria-label="'试听：'+example.nl"><span lang="nl">{{ example.nl }} <small>♪</small></span><span>{{ example.zh }}</span></button></div>
      <h3>选出合适的表达</h3><fieldset v-for="(exercise,index) in grammar.exercises" :key="grammar.id+index" class="question"><legend>{{ index+1 }}. {{ exercise.question }}</legend><label v-for="(option,optionIndex) in exercise.options" :key="optionIndex" :class="{selected:practice.answers[`g:${grammar.id}:${index}`] === optionIndex}"><input type="radio" :name="`g:${grammar.id}:${index}`" :checked="practice.answers[`g:${grammar.id}:${index}`] === optionIndex" :disabled="!store.load" @change="answer(`g:${grammar.id}:${index}`,optionIndex)"/><span lang="nl">{{ option }}</span></label><p v-if="practice.answers[`g:${grammar.id}:${index}`] !== undefined" class="feedback" :class="{correct:practice.answers[`g:${grammar.id}:${index}`] === exercise.answer}"><b>{{ practice.answers[`g:${grammar.id}:${index}`] === exercise.answer ? '答对了。' : '再看一下语序。' }}</b>{{ exercise.explanation }}</p></fieldset>
      <button class="secondary" @click="resetGrammar">重做本单元</button><p class="small-note">做完后，试着用同一句型描述你自己的经历。</p>
    </section>

    <section v-else-if="tab === 'reading'" class="practice-panel">
      <label class="task-picker">选择阅读材料<select v-model="readingId"><option v-for="(item,index) in readings" :key="item.id" :value="item.id">{{ String(index+1).padStart(2,'0') }} · {{ item.titleTranslate }}</option></select></label>
      <div class="task-heading"><div><span class="eyebrow">LEZEN · {{ reading.topic }}</span><h2 lang="nl">{{ reading.title }}</h2><p>{{ reading.titleTranslate }} · {{ countDutchWords(reading.paragraphs.flat().map(pair=>pair[0]).join(' ')) }} 词</p></div><button class="secondary" @click="showTranslation=!showTranslation">{{ showTranslation ? '隐藏中文' : '显示中文译文' }}</button></div>
      <div class="reading-copy"><div v-for="(paragraph,index) in reading.paragraphs" :key="reading.id+index" class="reading-paragraph"><p lang="nl">{{ paragraph.map(pair=>pair[0]).join(' ') }}</p><p v-if="showTranslation" class="translation">{{ paragraph.map(pair=>pair[1]).join('') }}</p><button class="listen-link" @click="speak(paragraph.map(pair=>pair[0]).join(' '))" :aria-label="'试听第 '+(index+1)+' 段'">♪ 试听这一段</button></div></div>
      <button class="primary" :disabled="opening || !store.load" @click="openReading">{{ opening ? '正在打开…' : '进入全文跟写 / 听写' }} →</button>
      <h3>读懂主旨与细节</h3><fieldset v-for="(question,index) in reading.questions" :key="reading.id+index" class="question"><legend>{{ index+1 }}. {{ question.stem }}</legend><label v-for="(option,optionIndex) in question.options" :key="optionIndex" :class="{selected:practice.answers[`r:${reading.id}:${index}`] === optionIndex}"><input type="radio" :name="`r:${reading.id}:${index}`" :checked="practice.answers[`r:${reading.id}:${index}`] === optionIndex" :disabled="!store.load" @change="answer(`r:${reading.id}:${index}`,optionIndex)"/><span lang="nl">{{ option }}</span></label><p v-if="practice.answers[`r:${reading.id}:${index}`] !== undefined" class="feedback" :class="{correct:practice.answers[`r:${reading.id}:${index}`] === question.correctAnswer[0].charCodeAt(0)-97}"><b>{{ practice.answers[`r:${reading.id}:${index}`] === question.correctAnswer[0].charCodeAt(0)-97 ? '答对了。' : '回到文中再找找。' }}</b>{{ question.explanation }}</p></fieldset>
      <div class="routine"><h3>把理解变成表达</h3><p>{{ reading.speakingPrompt }}</p><p>{{ reading.writingPrompt }}</p></div>
    </section>

    <section v-else-if="tab === 'writing'" class="practice-panel">
      <label class="task-picker">选择写作任务<select v-model="writingId"><option v-for="(item,index) in skills.writingTasks" :key="item.id" :value="item.id">{{ String(index+1).padStart(2,'0') }} · {{ item.title }}</option></select></label>
      <span class="eyebrow">SCHRIJVEN · {{ writing.minWords }}–{{ writing.maxWords }} WOORDEN</span><h2>{{ writing.title }}</h2><p class="scenario" lang="nl">{{ writing.scenario }}</p><p>{{ writing.prompt }}</p><ul class="requirements"><li v-for="item in writing.requirements" :key="item">{{ item }}</li></ul>
      <label class="editor-label" for="b1-writing">用荷兰语写下来</label><textarea id="b1-writing" class="draft-editor" lang="nl" spellcheck="true" :value="draft" :disabled="!store.load" placeholder="Beste… / Ik wil graag…" @input="saveDraft(($event.target as HTMLTextAreaElement).value)"></textarea><div class="editor-footer"><span :class="{within:words>=writing.minWords && words<=writing.maxWords}">{{ words }} / {{ writing.minWords }}–{{ writing.maxWords }} 词</span><span>{{ store.load ? '草稿随学习记录保存' : '正在读取记录…' }}</span></div>
      <h3>写完后，逐项检查</h3><div class="checklist"><label v-for="(item,index) in writing.checklist" :key="writing.id+index"><input type="checkbox" :checked="checks(writing.id).includes(index)" :disabled="!store.load" @change="check(writing.id,index,($event.target as HTMLInputElement).checked)"/>{{ item }}</label></div>
      <div class="task-actions"><button class="primary" :disabled="!writingReady || !store.load" @click="complete(writing.id)">{{ practice.completed[writing.id] ? '✓ 已完成这次自评练习' : '记录本次练习完成' }}</button><button class="secondary" @click="showModel=!showModel">{{ showModel ? '收起范文' : '对照范文' }}</button></div><p class="small-note">达到字数范围并完成自检后可记录完成。自检不判断语法是否正确；可以请老师或语言伙伴反馈。</p>
      <div v-if="showModel" class="model-answer"><h3>参考范文 <button class="listen-link" @click="speak(writing.model)">♪ 试听</button></h3><p lang="nl">{{ writing.model }}</p><details><summary>查看中文参考译文</summary><p>{{ writing.modelTranslation }}</p></details></div>
    </section>

    <section v-else class="practice-panel">
      <label class="task-picker">选择口语任务<select v-model="speakingId"><option v-for="(item,index) in skills.speakingTasks" :key="item.id" :value="item.id">{{ String(index+1).padStart(2,'0') }} · {{ item.title }}</option></select></label>
      <span class="eyebrow">SPREKEN · GESPREKKEN VOEREN</span><h2>{{ speaking.title }}</h2><p class="scenario" lang="nl">{{ speaking.scenario }}</p><ol class="requirements"><li v-for="item in speaking.prompts" :key="item">{{ item }}</li></ol>
      <div class="speaking-timer"><div aria-live="polite"><span>{{ timerPhase || `${speaking.prepSeconds} 秒准备 → ${speaking.speakSeconds} 秒表达` }}</span><strong>{{ countdown ? `${Math.floor(countdown/60)}:${String(countdown%60).padStart(2,'0')}` : '开口练一练' }}</strong></div><button class="primary" @click="startTimer">{{ timerPhase ? '重新开始计时' : '开始计时' }}</button><button v-if="countdown" class="secondary" @click="stopTimer();timerPhase='已暂停'">暂停</button></div>
      <div class="examples"><button v-for="phrase in speaking.phrases" :key="phrase.nl" @click="speak(phrase.nl)"><span lang="nl">{{ phrase.nl }} <small>♪</small></span><span>{{ phrase.zh }}</span></button></div>
      <label class="editor-label" for="b1-speaking">写几个关键词，再用自己的话说</label><textarea id="b1-speaking" class="draft-editor short" lang="nl" :value="notes" :disabled="!store.load" placeholder="Mijn mening / een reden / een voorbeeld…" @input="saveNotes(($event.target as HTMLTextAreaElement).value)"></textarea>
      <h3>说完后，给自己一点反馈</h3><div class="checklist"><label v-for="(item,index) in speaking.checklist" :key="speaking.id+index"><input type="checkbox" :checked="checks(speaking.id).includes(index)" :disabled="!store.load" @change="check(speaking.id,index,($event.target as HTMLInputElement).checked)"/>{{ item }}</label></div>
      <div class="task-actions"><button class="primary" :disabled="!store.load || !speaking.checklist.every((_,index)=>checks(speaking.id).includes(index))" @click="complete(speaking.id)">{{ practice.completed[speaking.id] ? '✓ 已完成这次自评练习' : '记录本次练习完成' }}</button><button class="secondary" @click="showModel=!showModel">{{ showModel ? '收起示范' : '参考表达示范' }}</button></div><p class="small-note">可独自练习，或请语言伙伴扮演另一方。计时与清单用于自检，不提供录音评分。</p>
      <div v-if="showModel" class="model-answer"><h3>表达示范 <button class="listen-link" @click="speak(speaking.model)">♪ 试听</button></h3><p lang="nl">{{ speaking.model }}</p><details><summary>查看中文参考译文</summary><p>{{ speaking.modelTranslation }}</p></details></div>
    </section>
    <footer class="b1-footer">草稿、选择题和自评记录保存在当前浏览器，并随「设置」中的学习数据备份导出。<a href="https://erk-nederlands.taalunie.org/erk-niveau/b1/" target="_blank" rel="noopener noreferrer">B1 能力描述 · Nederlandse Taalunie ↗</a></footer>
  </main>
</template>

<style scoped>
.b1-page{height:100%;overflow:auto;box-sizing:border-box;padding:28px 42px 55px;background:#fafaf5;color:#293f37;font:14px/1.8 "Segoe UI","Microsoft YaHei",sans-serif}*{box-sizing:border-box}button,textarea,select{font:inherit}button{cursor:pointer}a{color:inherit;text-decoration:none}button:disabled{opacity:.5;cursor:default}button:focus-visible,a:focus-visible{outline:2px solid #df673b;outline-offset:4px}.b1-header,.b1-intro,.skill-counts,.b1-tabs,.route-panel,.practice-panel,.b1-footer,.loading-note{max-width:1090px;margin-left:auto;margin-right:auto}.b1-header{display:flex;justify-content:space-between;align-items:center;color:#87917c;font-size:11px}.b1-header>span{font-size:9px;letter-spacing:2px}.b1-intro{padding:32px 0 24px}.target-tag{font-size:11px;color:#bd643f;background:#f7e8dd;padding:5px 11px;border-radius:20px}h1{font-size:34px;line-height:1.5;letter-spacing:-1px;font-weight:650;margin:16px 0 8px}.b1-intro p{color:#7e8b78;max-width:740px;font-size:13px}.skill-counts{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#e7eadf;border:1px solid #e3e7da;border-radius:9px;overflow:hidden}.skill-counts>span{display:flex;flex-direction:column;background:#f2f5eb;padding:16px 20px;color:#8b967f;font-size:10px}.skill-counts b{font:24px Georgia,serif;color:#536e51;margin-bottom:4px}.b1-tabs{display:flex;gap:5px;margin-top:28px;margin-bottom:28px;border-bottom:1px solid #dfe4d6;overflow-x:auto}.b1-tabs button{border:0;background:transparent;color:#86917d;padding:12px 20px;white-space:nowrap;font-size:12px;border-bottom:2px solid transparent}.b1-tabs button.active{color:#d4643c;border-bottom-color:#d4643c;font-weight:600}.route-heading h2{font-size:22px;margin:0 0 8px;font-weight:600}.route-heading p{color:#8b967f;font-size:12px;margin-bottom:23px}.route-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:17px}.route-card{display:block;text-align:left;padding:24px;border:1px solid #e0e5d6;border-radius:9px;background:#fffefa;color:#30463a}.route-card:hover{border-color:#c3ceb3;box-shadow:0 4px 15px #25382508}.route-card>span{font-size:10px;color:#97a185}.route-card h3{font-size:17px;margin:13px 0 10px;font-weight:600;line-height:1.6}.route-card p{font-size:11px;color:#88967d;line-height:1.9;min-height:62px}.route-card>b{display:block;margin-top:16px;font-size:11px;font-weight:500;color:#8a9d70}.route-card.accent{background:#f8ede3;border-color:#ead4c0}.route-card.accent>b{color:#c5764c}.routine{background:#f0f3e8;border-left:3px solid #9eb186;padding:17px 23px;margin-top:25px;border-radius:0 7px 7px 0}.routine h3{font-size:15px;margin:0 0 6px}.routine p{font-size:12px;color:#7c8b70;margin:8px 0;line-height:1.9}.scope-note{font-size:11px;line-height:1.9;color:#99a08e;margin-top:22px}.practice-panel{max-width:900px}.task-picker{display:flex;align-items:center;gap:15px;color:#89967a;font-size:11px;margin-bottom:25px}.task-picker select{border:1px solid #dce3d0;background:#fffefa;color:#516447;border-radius:6px;padding:10px 13px;min-width:260px;max-width:100%;font-size:12px}.task-heading{display:flex;align-items:center;justify-content:space-between;gap:20px}.eyebrow{font-size:10px;color:#99a188;letter-spacing:1.6px}h2{font-weight:600;font-size:25px;line-height:1.6;margin:8px 0}h3{font-size:17px;font-weight:600;margin-top:28px}.task-heading p{font-family:Georgia,serif;font-style:italic;color:#9ca58f;margin:4px 0 18px}.score{font-size:11px;background:#edf2e6;color:#7c9366;padding:7px 12px;border-radius:20px;white-space:nowrap}.explanation{line-height:2;color:#7c8972;font-size:13px}.pattern{background:#f0f3e9;border:1px solid #e1e6d6;padding:14px 18px;margin:20px 0;border-radius:7px;color:#6f875d;font-size:12px}.examples{display:grid;gap:9px;margin:20px 0}.examples button{display:flex;flex-direction:column;gap:5px;text-align:left;padding:13px 17px;border:1px solid #e7e9df;background:#fffefa;border-radius:7px}.examples button>span:first-child{font-size:15px;color:#516c48}.examples button>span:last-child{font-size:11px;color:#97a18b}.examples small{color:#acb89b;margin-left:7px}.question{margin:20px 0;padding:16px 20px 13px;background:#fffefa;border:1px solid #e1e6d6;border-radius:8px;min-width:0}.question legend{font-size:13px;font-weight:600;padding:0 6px;line-height:1.7}.question>label{display:flex;gap:11px;align-items:flex-start;padding:9px 12px;border:1px solid #ecede4;margin:7px 0;border-radius:5px;font-size:13px;cursor:pointer}.question>label.selected{background:#eef3e5;border-color:#bfcdae}.question input{accent-color:#829a69;margin-top:5px;flex-shrink:0}.feedback{font-size:12px;color:#b17b56;padding:12px 0 0;line-height:1.9}.feedback.correct{color:#708b5c}.feedback b{margin-right:7px}.primary,.secondary{border-radius:6px;padding:10px 17px;font-size:12px;border:1px solid #dce3d0;background:#fffefa;color:#80916e;white-space:nowrap}.primary{background:#dd673e;color:white;border-color:#dd673e}.secondary:hover{background:#eef2e7}.small-note,.loading-note{font-size:11px;color:#9aa38e;line-height:1.9}.reading-copy{font:17px/2 Georgia,"Segoe UI",serif;color:#50664a;margin:25px 0}.reading-paragraph{margin:22px 0}.reading-paragraph>p{margin:0 0 7px}.reading-copy .translation{font:12px/2 "Microsoft YaHei",sans-serif;color:#97a08a;padding-left:14px;border-left:2px solid #e4e9d8}.listen-link{border:0;background:transparent;font:11px "Segoe UI","Microsoft YaHei",sans-serif;color:#9aa986;padding:3px 0;cursor:pointer}.scenario{background:#f0f3e8;padding:15px 20px;font-size:16px;color:#68815b;line-height:1.9;border-radius:7px}.practice-panel>p:not(.scenario):not(.small-note){color:#849276;font-size:13px}.requirements{font-size:12px;color:#859476;padding-left:22px}.requirements li{margin:8px 0}.editor-label{display:block;color:#798d68;font-size:12px;font-weight:600;margin:23px 0 10px}.draft-editor{display:block;width:100%;min-height:310px;resize:vertical;background:#fffefa;color:#425b3a;font:16px/1.9 "Segoe UI",sans-serif;padding:20px;border:1px solid #dce4cf;border-radius:8px;outline-color:#b2c49b}.draft-editor.short{min-height:130px}.draft-editor::placeholder{color:#bcc4b0}.editor-footer{display:flex;justify-content:space-between;gap:15px;font-size:10px;color:#a0aa90;margin-top:8px}.editor-footer .within{color:#718e58}.checklist{display:grid;gap:10px;margin:16px 0 23px}.checklist label{display:flex;gap:10px;align-items:flex-start;font-size:12px;color:#829272}.checklist input{margin-top:5px;accent-color:#829a69}.task-actions{display:flex;gap:10px;flex-wrap:wrap}.model-answer{padding:18px 24px;background:#f3f5eb;border:1px solid #e1e7d5;border-radius:8px;margin-top:24px}.model-answer h3{margin-top:0}.model-answer h3 button{margin-left:10px}.model-answer>p{white-space:pre-wrap;font-size:15px;line-height:2;color:#6a805b}.model-answer details{color:#8b9a7a;font-size:12px}.model-answer details summary{cursor:pointer}.speaking-timer{display:flex;gap:15px;align-items:center;flex-wrap:wrap;background:#f0f3e8;padding:20px;border-radius:8px;margin:23px 0}.speaking-timer>div{margin-right:auto}.speaking-timer span{display:block;font-size:11px;color:#9aa98a}.speaking-timer strong{display:block;font:26px Georgia,serif;color:#789263;margin-top:6px}.b1-footer{font-size:10px;line-height:1.9;color:#a0aa93;border-top:1px solid #e1e7d7;margin-top:35px;padding-top:20px}.b1-footer>a{display:block;color:#879a73;margin-top:6px}@media(max-width:1000px){.b1-page{padding:25px}.route-grid{grid-template-columns:repeat(2,1fr)}.skill-counts>span{padding:14px 12px}.skill-counts b{font-size:20px}.b1-tabs button{padding:11px 15px}}@media(max-width:600px){.b1-page{padding:22px 18px 40px}.b1-header>span{font-size:7px;letter-spacing:1px}h1{font-size:27px}.b1-intro p{font-size:12px}.skill-counts{grid-template-columns:repeat(3,1fr)}.skill-counts>span{padding:11px;font-size:9px}.skill-counts b{font-size:19px}.route-grid{grid-template-columns:1fr}.route-card{padding:20px}.route-card p{min-height:0}.task-picker{display:block}.task-picker select{display:block;width:100%;margin-top:7px;min-width:0}.task-heading{align-items:flex-start;flex-wrap:wrap;gap:3px}h2{font-size:22px}.task-heading .score{margin-bottom:14px}.reading-copy{font-size:16px}.question{padding:12px 10px}.question>label{font-size:12px}.draft-editor{padding:14px;font-size:16px;min-height:330px}.draft-editor.short{min-height:140px}.editor-footer{flex-wrap:wrap;gap:4px}.route-heading h2{font-size:20px}.scenario{font-size:15px}.b1-tabs button{font-size:11px;padding:11px 13px}.model-answer{padding:17px}.model-answer>p{font-size:14px}.speaking-timer{padding:16px}}
</style>
