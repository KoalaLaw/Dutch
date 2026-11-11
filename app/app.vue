<!-- Type Dutch adaptation: modified 2026-11-10. Upstream: zyronon/TypeWords, GPL-3.0. -->
<script setup lang="ts">
import { accountState } from '@/core/utils/cloud-account'
const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const siteOrigin = String(runtimeConfig.public.origin || 'https://koalalaw.github.io').replace(/\/$/, '')

const canonicalURL = $computed(() => `${siteOrigin}${runtimeConfig.app.baseURL}#${route.path}`)

const nonIndexableRoutePrefixes = [
  '/fsrs',
  '/account',
  '/import',
  '/practice-articles',
  '/practice-sentences',
  '/practice-words',
  '/rrweb',
  '/setting',
  '/test',
  '/words-test',
]

const robotsContent = $computed(() => {
  const hostname = import.meta.client ? window.location.hostname : new URL(`${siteOrigin}/`).hostname
  const isDevelopmentHost = ['dev.typewords.cc', 'localhost', '127.0.0.1'].includes(hostname)
  const isFunctionalPage = nonIndexableRoutePrefixes.some(prefix =>
    route.path === prefix || route.path.startsWith(`${prefix}/`)
  )

  return isDevelopmentHost || isFunctionalPage
    ? 'noindex, nofollow, noarchive'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
})

useHead(() => ({
  link: [
    {
      key: 'canonical',
      rel: 'canonical',
      href: canonicalURL,
    },
  ],
  meta: [
    {
      key: 'robots',
      name: 'robots',
      content: robotsContent,
    },
  ],
}))
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <div v-if="accountState.switching" class="account-switching" role="status">正在切换个人学习空间…</div>
</template>
<style scoped>.account-switching{position:fixed;inset:0;z-index:999999;display:grid;place-items:center;background:#fafaf4;color:#35513c;font:16px 'Segoe UI','Microsoft YaHei',sans-serif}</style>
