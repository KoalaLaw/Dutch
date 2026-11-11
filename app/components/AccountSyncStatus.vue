<script setup lang="ts">
import { computed } from 'vue'
import { accountState } from '@/core/utils/cloud-account'
const labels:Record<string,string>={guest:'访客 · 本机保存',local:'本机已保存',synced:'已同步',pending:'等待同步',syncing:'正在同步…',offline:'离线 · 本机已保存',conflict:'需要选择进度',expired:'请重新登录',error:'同步待重试'}
const label=computed(()=>!accountState.ready?'正在恢复账号…':accountState.status==='synced'&&!accountState.revision?'账号已连接':labels[accountState.status])
</script>
<template><NuxtLink class="account-status" to="/account" :class="{attention:['conflict','error','expired','offline'].includes(accountState.status)}"><span aria-hidden="true">●</span><div><b>{{ accountState.user?.username||'账号与同步' }}</b><small>{{ label }}</small></div><span aria-hidden="true">↗</span></NuxtLink></template>
<style scoped>.account-status{display:flex;align-items:center;gap:9px;padding:13px 10px;border:1px solid #d8e0cd;border-radius:9px;background:#f3f6eb;color:#4f6e43;text-decoration:none;font:11px/1.7 'Segoe UI','Microsoft YaHei',sans-serif}.account-status>span:first-child{font-size:8px}.account-status div{min-width:0;flex:1}.account-status b,.account-status small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.account-status b{font-weight:600}.account-status small{font-size:9px;color:#718060}.attention{border-color:#d9bda1;background:#fff4e7;color:#955c31}.account-status:focus-visible{outline:2px solid #bd522b;outline-offset:3px}</style>
