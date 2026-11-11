<script setup lang="ts">
import { computed } from 'vue'
import plan from '@/data/daily-plan.json'
import { useDailyLearning } from '@/core/composables/useDailyLearning'
import { recommendedDay, isDailyComplete, dailyTaskKeys } from '@/core/utils/daily-learning'
const daily=useDailyLearning()
const next=computed(()=>recommendedDay(plan.days,daily.state.value))
const completed=computed(()=>plan.days.filter(day=>isDailyComplete(day,daily.state.value)).length)
const tasks=computed(()=>dailyTaskKeys(next.value).filter(key=>daily.state.value.days[next.value.id]?.done.includes(key)).length)
</script>
<template>
 <section class="route-overview" aria-label="每天20至30分钟学习路线">
  <div class="route-today"><div><span class="kicker">你的每日路线 · 20–30 分钟</span><h2>接着第 {{ next.number }} 天学：{{ next.title }}</h2><p>{{ next.review?'本周复习 → 整理表达 → 能力自检':'5 分钟复习 → 10 个新词 → 一项短练习' }} · 今天已完成 {{ tasks }} / 3 项</p></div><NuxtLink :to="'/plan?day='+next.id">{{ completed?'继续今天的学习':'打开第 '+next.number+' 天' }} <span>→</span></NuxtLink></div>
  <div class="route-progress"><i :style="{width:completed/plan.dayCount*100+'%'}"/></div>
  <div class="route-stats"><span>{{ completed }} / {{ plan.dayCount }} 个学习日完成</span><span>{{ plan.packCount }} 个主题 · {{ plan.wordCount.toLocaleString() }} 条词汇与搭配 · 每周 1 天复习</span></div>
  <div class="route-phases"><NuxtLink v-for="phase in plan.phases" :key="phase.id" :to="'/plan?day='+plan.days[phase.firstDay-1].id"><span>{{ phase.level }}</span><strong>{{ phase.label }}</strong><p>{{ phase.goal }}</p><small>第 {{ phase.firstWeek }}–{{ phase.lastWeek }} 周 · {{ phase.packCount }} 主题</small></NuxtLink></div>
 </section>
</template>
<style scoped>
.route-overview{border:1px solid #dde4d0;background:#f1f5e8;border-radius:13px;padding:25px;margin:5px 0 32px;color:#2d4436}.route-today{display:flex;align-items:center;gap:24px;justify-content:space-between}.kicker{font-size:10px;letter-spacing:1px;color:#607a4d}.route-today h2{font-size:21px;font-weight:600;line-height:1.6;margin:10px 0}.route-today p{font-size:12px;color:#5f7254;line-height:1.8}.route-today>a{flex-shrink:0;display:flex;align-items:center;gap:23px;border-radius:7px;background:#bd522b;color:white;padding:13px 18px;font-size:12px;text-decoration:none}.route-progress{height:4px;border-radius:3px;background:#dbe5cc;margin:17px 0 11px}.route-progress>i{display:block;height:100%;background:#78955d}.route-stats{display:flex;justify-content:space-between;gap:15px;color:#687a5b;font-size:10px;line-height:1.8}.route-phases{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}.route-phases>a{display:block;background:#fffef8;border:1px solid #dce4cf;border-radius:9px;padding:17px;color:inherit;text-decoration:none}.route-phases>a>span{font-size:10px;color:#99704b}.route-phases strong{display:block;font-size:16px;margin:8px 0}.route-phases p{font-size:11px;line-height:1.9;color:#63745a;margin:8px 0}.route-phases small{font-size:10px;color:#697c5b}a:focus-visible{outline:2px solid #b8522b;outline-offset:4px}@media(max-width:650px){.route-overview{padding:18px}.route-today{display:block}.route-today h2{font-size:19px}.route-today>a{display:inline-flex;margin:7px 0}.route-stats{display:block}.route-stats>span{display:block;margin-top:5px}.route-phases{grid-template-columns:1fr;gap:9px}.route-phases>a{padding:14px}.route-phases strong{font-size:15px;margin:5px 0}.route-phases p{margin:5px 0}}
</style>
