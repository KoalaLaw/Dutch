<!-- Type Dutch adaptation: modified 2026-11-11. Upstream: zyronon/TypeWords, GPL-3.0. -->
<script setup lang="ts">
import { BaseIcon, Close, VolumeIcon } from '@/base'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayWordAudio } from '@/core/hooks/sound.ts'
import { closeWordLookup, wordLookupState } from '@/core/hooks/useWordLookup.ts'
import { openWordCollectPicker } from '@/core/hooks/useWordCollectPicker.ts'
import { getDefaultWord } from '@/core/types/func.ts'
import { dutchDictionaryLinks } from '@/core/utils/dutch-dictionary'
import TranslationList from './TranslationList.vue'

const { t: $t } = useI18n()
const playWordAudio = usePlayWordAudio()
const popover = ref<HTMLElement | null>(null)
const dictionaryLinks = computed(() => dutchDictionaryLinks(wordLookupState.queryWord))
const isExternalLookup = computed(() => !wordLookupState.loading && wordLookupState.notFound)
const style = computed(() => ({
  left: isExternalLookup.value ? '50%' : wordLookupState.x + 'px',
  top: isExternalLookup.value ? '50%' : wordLookupState.y + 'px',
}))
const collectTarget = computed(() => wordLookupState.data || (wordLookupState.queryWord ? getDefaultWord({ word: wordLookupState.queryWord }) : null))
function openCollect(e: MouseEvent) {
  e.stopPropagation()
  if (collectTarget.value) openWordCollectPicker(collectTarget.value, e.currentTarget as HTMLElement)
}
function onDocumentClick(e: MouseEvent) {
  if (popover.value && !popover.value.contains(e.target as Node)) closeWordLookup()
}
function onKeydown(e: KeyboardEvent) { if (e.key === 'Escape') closeWordLookup() }
function updatePopoverPosition() {
  if (!wordLookupState.visible || !popover.value || isExternalLookup.value) return
  const el = popover.value
  const rect = el.getBoundingClientRect()
  const padding = 8
  const left = Math.max(padding, Math.min(wordLookupState.x - rect.width / 2, window.innerWidth - rect.width - padding))
  let top = wordLookupState.y
  if (top + rect.height > window.innerHeight - padding) top = wordLookupState.y - rect.height - 16
  el.style.left = left + 'px'
  el.style.top = Math.max(padding, Math.min(top, window.innerHeight - rect.height - padding)) + 'px'
}
onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', updatePopoverPosition)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', updatePopoverPosition)
})
watch(() => [wordLookupState.visible, wordLookupState.x, wordLookupState.y, wordLookupState.loading, wordLookupState.notFound], () => {
  if (wordLookupState.visible) nextTick(updatePopoverPosition)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="wordLookupState.visible" ref="popover" class="word-lookup-popover"
        :class="{ 'word-lookup-popover--external': isExternalLookup }" :style="style" @click.stop>
        <Close class="close-btn" :title="$t('close')" @click="closeWordLookup" />
        <div v-if="wordLookupState.loading" class="text-sm color-gray py-2 pr-5">查询中...</div>
        <template v-else>
          <div class="flex items-center gap-2 flex-wrap pr-7">
            <span lang="nl" class="text-lg font-medium">{{ wordLookupState.data?.word || wordLookupState.queryWord }}</span>
            <VolumeIcon :cb="() => playWordAudio(wordLookupState.data?.word || wordLookupState.queryWord)" />
            <BaseIcon v-if="collectTarget" @click="openCollect" :title="$t('collect_to_dict')"><IconFluentStarAdd16Regular /></BaseIcon>
          </div>
          <TranslationList v-if="wordLookupState.data?.trans?.length" class="mt-2" :word="wordLookupState.data" :show-full="true" :pos-space="false" />
          <p v-if="wordLookupState.notFound" class="lookup-note">课程词库中暂未收录。可在新窗口查看中文翻译或荷兰语释义。</p>
          <nav class="dictionary-links" aria-label="荷兰语词典">
            <span class="lookup-language">源语言：荷兰语（Nederlands）</span>
            <a v-for="link in dictionaryLinks" :key="link.href" :href="link.href" target="_blank" rel="noopener noreferrer">{{ link.label }} ↗</a>
          </nav>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.word-lookup-popover {
  position: fixed;
  z-index: 10000;
  box-sizing: border-box;
  width: max-content;
  max-width: min(22rem, calc(100vw - 16px));
  min-width: min(15rem, calc(100vw - 16px));
  max-height: calc(100dvh - 16px);
  overflow: auto;
  background: var(--color-tooltip-bg);
  border: 1px solid var(--color-item-border);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
}
.word-lookup-popover--external { transform: translate(-50%, -50%); width: min(28rem, calc(100vw - 16px)); max-width: min(28rem, calc(100vw - 16px)); }
.dictionary-links {
  display: flex; flex-direction: column; align-items: flex-start; gap: 0.6rem;
  margin-top: 0.85rem; padding-top: 0.7rem; border-top: 1px solid var(--color-item-border);
  a { color: var(--color-link, #c15a25); text-decoration: underline; text-underline-offset: 3px; }
}
.lookup-language, .lookup-note { font-size: 0.85rem; line-height: 1.6; color: var(--color-gray); }
.lookup-note { margin-top: 0.75rem; }
.close-btn { position: absolute; top: 1.1rem; right: 1rem; z-index: 1; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
