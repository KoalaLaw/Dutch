<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Word } from '@/core/types'
import type { DailyWordSession } from '@/core/utils/daily-learning'
import { normalizeDutchInput } from '@/core/utils/dutch'
import { getDutchGrammar } from '@/core/utils/dutch-grammar'
import DutchGrammarPanel from '@/components/word/DutchGrammarPanel.vue'
import { usePlayWordAudio, useTTsPlayAudio, cancelWordPracticeAudio } from '@/core/hooks/sound'
const props = defineProps<{ words: Word[]; session: DailyWordSession; busy?: boolean; review?: boolean }>()
const emit = defineEmits<{
  update: [session: DailyWordSession, word?: Word, helped?: boolean]
}>()
const speak = usePlayWordAudio(), sentenceAudio = useTTsPlayAudio()
const input = ref(props.session.input || ''), error = ref(''), hint = ref(false)
const field = ref<HTMLInputElement>()
const word = computed(() => props.words.find(item => item.id === props.session.ids[props.session.index]))
const learning = computed(() => props.session.round === 'learn')
const finished = computed(() => props.session.round === 'done')
watch(() => props.session.round+'|'+props.session.index+'|'+props.session.ids.join('|'), async () => {
  input.value = props.session.input || ''; error.value=''; hint.value=false
  await nextTick(); field.value?.focus()
  if (word.value && !finished.value) speak(word.value.word, false)
})
function updateInput(value: string) { input.value=value; emit('update',{...props.session,input:value}) }
function reveal() {
  hint.value=true
  if (!learning.value && word.value) emit('update',{...props.session,missed:[...new Set([...props.session.missed,word.value.id])]})
}
function submit() {
  if (props.busy || !word.value || finished.value) return
  if (normalizeDutchInput(input.value)!==normalizeDutchInput(word.value.word)) {
    error.value='还差一点。检查拼写、冠词、空格和重音符号，再试一次。'
    if (!learning.value) emit('update',{...props.session,input:input.value,missed:[...new Set([...props.session.missed,word.value.id])]})
    return
  }
  const current=word.value, helped=props.session.missed.includes(current.id)
  const next={...props.session,index:props.session.index+1,input:''}
  if (!learning.value && !helped) next.correct++
  if (next.index>=next.ids.length) {
    if (learning.value) { next.round='recall'; next.index=0; next.missed=[]; next.correct=0 }
    else next.round='done'
  }
  emit('update',next,learning.value ? undefined : current,helped)
}
function startRecall() { emit('update',{...props.session,round:'recall',index:0,input:'',missed:[],correct:0}) }
onMounted(()=>field.value?.focus())
watch(()=>props.busy,async value=>{if(!value){await nextTick();field.value?.focus()}})
onUnmounted(cancelWordPracticeAudio)
</script>
<template>
  <div class="daily-words">
    <template v-if="finished">
      <div class="practice-finished"><span>✓</span><h3>本组已练完</h3><p>不看提示一次答对 {{ session.correct }} / {{ session.ids.length }} 个。看过提示的词已记录，会继续安排复习。</p></div>
    </template>
    <template v-else-if="word">
      <div class="practice-heading"><span>{{ learning ? '第一轮 · 听音跟写' : review ? '复习 · 回想原词和拼写' : '第二轮 · 盖住原词，回想拼写' }}</span><strong>{{ session.index+1 }} / {{ session.ids.length }}</strong></div>
      <div class="mini-progress"><i :style="{width:(session.index/session.ids.length*100)+'%'}" /></div>
      <div class="practice-word-row"><h3 lang="nl">{{ learning || hint ? word.word : '听一听，写下来' }}</h3><button type="button" class="play" aria-label="播放当前荷兰语单词" @click="speak(word.word,false)">▶ 试听</button></div>
      <p class="meaning">{{ word.trans.map(item=>item.cn).join('；') }}</p>
      <DutchGrammarPanel v-if="learning || hint" :word="word.word" />
      <p v-else class="round-tip">词性：{{ getDutchGrammar(word)?.pos || word.trans[0]?.pos }}</p>
      <p class="round-tip">{{ learning ? '先听，再输入完整词语；名词连同 de / het 一起记。' : '根据发音和中文回想单词。需要帮助时可以显示原词。' }}</p>
      <form @submit.prevent="submit">
        <label for="daily-word-input">输入荷兰语</label>
        <div class="input-row"><input id="daily-word-input" ref="field" :value="input" @input="updateInput(($event.target as HTMLInputElement).value)" lang="nl" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" :disabled="busy" @keydown.stop/><button type="submit" :disabled="busy || !input.trim()">{{ busy ? '保存中…' : '检查并继续 →' }}</button></div>
      </form>
      <p role="status" class="error">{{ error }}</p>
      <div class="practice-actions"><button v-if="!learning && !hint" type="button" @click="reveal">显示原词</button><button v-if="learning && session.index===0" type="button" @click="startRecall">以前学过？直接进入听写</button></div>
      <div v-if="(learning || hint) && word.sentences?.[0]" class="example"><button type="button" aria-label="播放荷兰语例句" @click="sentenceAudio(word.sentences[0].c)">▶</button><div><p lang="nl">{{ word.sentences[0].c }}</p><small>{{ word.sentences[0].cn }}</small></div></div>
    </template>
    <p v-else>正在恢复这组单词…</p>
  </div>
</template>
<style scoped>
.daily-words{padding:22px;border:1px solid #e0e6d8;border-radius:14px;background:#fffef9;color:#273d35}.practice-heading{display:flex;justify-content:space-between;gap:15px;font-size:12px;color:#64765f}.mini-progress{height:4px;background:#edf0e6;border-radius:3px;margin:13px 0 24px}.mini-progress i{display:block;height:100%;background:#789361}.practice-word-row{display:flex;align-items:center;gap:16px}.practice-word-row h3{font-size:clamp(21px,3vw,32px);font-weight:600;margin:0;overflow-wrap:anywhere}.play{margin-left:auto;white-space:nowrap}.meaning{font-size:15px;margin:12px 0}.round-tip{font-size:12px;color:#65705e;line-height:1.8}button{font:inherit;cursor:pointer;border:1px solid #d6dfcc;border-radius:7px;background:#f5f6ed;padding:10px 15px;color:#36503c}button:disabled{opacity:.55;cursor:default}label{display:block;font-size:12px;margin:22px 0 8px}.input-row{display:flex;gap:10px}.input-row input{min-width:0;flex:1;background:white;border:1px solid #b9c7ac;border-radius:7px;padding:12px;font-size:17px;color:#29402e}.input-row button{background:#be522a;color:white;border-color:#be522a;font-size:13px}.error{min-height:19px;color:#a83c2d;font-size:12px;line-height:1.7}.practice-actions{display:flex;gap:12px;flex-wrap:wrap}.practice-actions button{font-size:12px;background:transparent;border:0;padding:6px 0;text-decoration:underline;text-underline-offset:4px}.example{display:flex;gap:12px;background:#f3f5e9;padding:15px;border-radius:8px;margin-top:18px}.example>button{align-self:flex-start;padding:5px 9px}.example p{margin:0 0 6px;line-height:1.7;font-size:14px}.example small{color:#637259;font-size:12px;line-height:1.7}.practice-finished{padding:20px;text-align:center}.practice-finished>span{display:inline-grid;place-items:center;width:48px;height:48px;background:#e3edda;border-radius:50%;color:#476b3e;font-size:26px}.practice-finished p{font-size:13px;line-height:1.9;color:#62745b}button:focus-visible,input:focus-visible{outline:2px solid #bc582e;outline-offset:3px}@media(max-width:600px){.daily-words{padding:18px}.input-row{flex-direction:column}.input-row button{min-height:44px}.practice-word-row{align-items:flex-start}.play{padding:9px}.practice-finished{padding:8px}}
</style>
