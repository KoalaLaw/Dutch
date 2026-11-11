<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
 getDutchGrammar, getDutchVerb, conjugateDutch, dutchTenses, dutchQuestion,
 dutchPrincipalParts, dutchVerbNotes, dutchNounNotes, type DutchTense,
} from '@/core/utils/dutch-grammar'
const props=withDefaults(defineProps<{word:string;expanded?:boolean}>(),{expanded:false})
const entry=computed(()=>getDutchGrammar(props.word)),verb=computed(()=>getDutchVerb(entry.value))
const tense=ref<DutchTense>('present'),auxiliary=ref<'hebben'|'zijn'>('hebben')
const activeTense=computed(()=>dutchTenses.find(item=>item.id===tense.value)!)
const rows=computed(()=>conjugateDutch(entry.value,tense.value,auxiliary.value))
const parts=computed(()=>dutchPrincipalParts(entry.value))
const verbNotes=computed(()=>dutchVerbNotes(entry.value)),nounNotes=computed(()=>dutchNounNotes(entry.value))
watch(()=>props.word,()=>{tense.value='present';auxiliary.value=verb.value?.auxiliary[0]??'hebben'},{immediate:true})
</script>
<template>
 <section v-if="entry" class="dutch-grammar" aria-label="荷兰语词性与用法">
  <div class="grammar-badges"><span class="pos-badge">{{ entry.pos }}</span><span v-if="entry.article" :class="['article-badge',entry.article]">{{ entry.article }} 词<span v-if="entry.number==='plural'"> · 复数</span></span><span v-if="verb?.prefix" class="feature-badge">可分动词</span><span v-if="entry.object?.includes('{r}')" class="feature-badge">反身用法</span><small lang="nl">{{ entry.posNl }}</small></div>
  <details v-if="verb || entry.kind==='noun'" :key="word" :open="expanded">
   <summary>{{ verb?'人称与时态变化':'冠词怎么用' }}<span>{{ verb?`${verb.auxiliary.join(' / ')} + ${verb.participle}`:entry.article?`${entry.article} ${entry.lemma}`:'常用时省略冠词' }}</span></summary>
   <template v-if="verb">
    <dl class="principal-parts"><div v-for="part in parts" :key="part.label"><dt>{{ part.label }}</dt><dd lang="nl">{{ part.value }}</dd></div></dl>
    <div class="tense-options" role="group" aria-label="选择动词时态"><button v-for="item in dutchTenses" :key="item.id" type="button" :aria-pressed="tense===item.id" :class="{active:tense===item.id}" @click="tense=item.id">{{ item.label }} <small>{{ item.nl }}</small></button></div>
    <p class="tense-hint">{{ activeTense.hint }}</p>
    <label v-if="verb.auxiliary.length>1 && ['perfect','pluperfect'].includes(tense)" class="aux-choice">本义的完成时助动词 <select v-model="auxiliary" aria-label="完成时助动词"><option v-for="aux in verb.auxiliary" :key="aux" :value="aux">{{ aux }}</option></select></label>
    <div class="conjugation-wrap"><table><caption class="sr-only">{{ word }} · {{ activeTense.label }}人称变化</caption><thead><tr><th scope="col">主语</th><th scope="col">变位与语序</th></tr></thead><tbody><tr v-for="row in rows" :key="row.subject" :class="{inapplicable:!row.applicable}"><th scope="row"><span lang="nl">{{ row.subject }}</span><small>{{ row.cn }}</small></th><td lang="nl">{{ row.form }}</td></tr></tbody></table></div>
    <div v-if="tense==='present' && dutchQuestion(entry)" class="inversion"><b>疑问句 / 倒装</b><p lang="nl">{{ dutchQuestion(entry) }}</p><p lang="nl">{{ dutchQuestion(entry,true) }}</p></div>
    <ul class="usage-notes"><li v-for="note in verbNotes" :key="note">{{ note }}</li></ul>
   </template>
   <template v-else><div v-if="entry.article" class="noun-combination"><span>把冠词和词语一起记</span><strong lang="nl">{{ entry.article }} {{ entry.lemma }}</strong></div><ul class="usage-notes"><li v-for="note in nounNotes" :key="note">{{ note }}</li></ul></template>
  </details>
  <p class="sense-note">词性按本词条所教的含义标注；同一个词在其他语境中可能有不同用法。</p>
 </section>
</template>
<style scoped>
.dutch-grammar{width:100%;min-width:0;text-align:left;font:13px/1.7 "Segoe UI","Microsoft YaHei",sans-serif;margin:14px 0;color:var(--color-main-text,#294035)}.grammar-badges{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.pos-badge,.article-badge,.feature-badge{display:inline-block;border-radius:5px;padding:2px 8px;font-size:11px;line-height:1.8;background:#e8eee1;color:#36543c;border:1px solid #d6e1ca}.article-badge.de{background:#e6edf5;color:#31597a;border-color:#ccdbe9}.article-badge.het{background:#f5e8d8;color:#89572d;border-color:#e8d3b9}.feature-badge{background:#f1ede4;color:#766347;border-color:#e3dac8}.grammar-badges>small{color:#75816e;font-size:10px}details{margin-top:10px;border:1px solid #dce3d3;border-radius:9px;background:var(--color-tooltip-bg,#fcfdf8);overflow:hidden}summary{cursor:pointer;padding:10px 12px;font-size:12px;font-weight:600;overflow-wrap:anywhere}summary>span{display:block;margin-left:14px;font-size:11px;font-weight:400;color:#72816b}details[open]>summary{border-bottom:1px solid #e1e7d8}.principal-parts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0;padding:14px 12px;background:color-mix(in srgb,#94aa70 6%,transparent)}.principal-parts>div{min-width:0}.principal-parts dt{font-size:10px;color:#75826e}.principal-parts dd{font-size:13px;margin:2px 0 0;overflow-wrap:anywhere}.tense-options{display:flex;gap:6px;flex-wrap:wrap;margin:14px 12px 10px}.tense-options button{font:inherit;font-size:11px;cursor:pointer;padding:6px 9px;border:1px solid #d4dec9;border-radius:6px;color:#526a44;background:var(--color-tooltip-bg,#fffef9)}.tense-options button small{font-size:9px;opacity:.75}.tense-options button.active{background:#e6eedb;border-color:#8ba86b;color:#2d5226}.tense-options button:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid #ad582f;outline-offset:2px}.tense-hint{font-size:11px;color:#74816c;margin:8px 12px;line-height:1.8}.conjugation-wrap{margin:12px;overflow:auto}table{width:100%;border-collapse:collapse;font-size:12px;text-align:left}th,td{padding:8px 9px;border-bottom:1px solid #e3e8dc;vertical-align:top;overflow-wrap:anywhere}thead th{font-weight:500;background:color-mix(in srgb,#94aa70 10%,transparent);font-size:10px;color:#6a7d5b}tbody th{font-weight:500;width:40%}tbody th small{display:block;font-size:10px;color:#7b8774}tbody td{font-weight:500}.inapplicable{opacity:.55}.aux-choice{font-size:11px;display:flex;align-items:center;gap:10px;margin:10px 12px}.aux-choice select{padding:4px 8px;background:var(--color-tooltip-bg,#fffef9);border:1px solid #c5d3b7;border-radius:5px;color:inherit;font:inherit}.inversion{padding:10px 12px;background:color-mix(in srgb,#d99b63 8%,transparent);margin:12px;border-radius:6px}.inversion b{font-size:10px;color:#9b6744}.inversion p{margin:3px 0;font-size:12px}.usage-notes{padding:0 16px 0 29px;margin:12px 0 15px;font-size:11px;color:#6b7d61;line-height:1.9}.usage-notes li+li{margin-top:7px}.noun-combination{display:flex;flex-direction:column;gap:3px;margin:12px}.noun-combination span{font-size:10px;color:#78836f}.noun-combination strong{font-size:17px;font-weight:600}.sense-note{font-size:10px;color:#89917f;margin:7px 0 0}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}@media(max-width:400px){.principal-parts{grid-template-columns:1fr}.tense-options{gap:5px}.tense-options button{padding:5px 7px}th,td{padding:7px 5px}}
</style>
