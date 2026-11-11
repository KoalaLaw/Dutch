// Type Dutch adaptation: modified 2026-11-10. Upstream: zyronon/TypeWords, GPL-3.0.
import { createDutchAudioPlayer, normalizeDutchAudioText } from '../utils/dutch-audio'
import dutchAudio from '@/data/dutch-audio.json'
import { withAppBaseURL } from '../utils/base-url'
import { onMounted, watchEffect } from 'vue'
import { useSettingStore } from '../stores/setting'
import { ref } from 'vue'

import { ENV, SoundFileOptions } from '../config/env'
import { Toast } from '@/base'

/**
 * 获取当前浏览器的 OS+浏览器 组合 key，用于 ttsVoiceMap 的索引
 * 返回如 "mac+chrome" / "windows+edge" / "ios+safari" 等固定组合
 */
export function getBrowserKey(): string {
  if (typeof navigator === 'undefined') return 'unknown+unknown'
  const ua = navigator.userAgent

  let os = 'unknown'
  if (/iPad|iPhone|iPod/.test(ua)) {
    os = 'ios'
  } else if (/Android/.test(ua)) {
    os = 'android'
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    os = 'mac'
  } else if (/Windows/.test(ua)) {
    os = 'windows'
  } else if (/Linux/.test(ua)) {
    os = 'linux'
  }

  let browser = 'unknown'
  if (/Edg\//.test(ua)) {
    browser = 'edge'
  } else if (/OPR\/|Opera/.test(ua)) {
    browser = 'opera'
  } else if (/Chrome\//.test(ua)) {
    browser = 'chrome'
  } else if (/Firefox\//.test(ua)) {
    browser = 'firefox'
  } else if (/Safari\//.test(ua)) {
    browser = 'safari'
  }

  return `${os}+${browser}`
}

export function useSound(audioSrcList?: string[], audioFileLength?: number) {
  let audioList = ref<HTMLAudioElement[]>([])
  let audioLength = ref(1)
  let index = ref(0)

  onMounted(() => {
    if (audioSrcList) setAudio(audioSrcList, audioFileLength)
  })

  //这里同一个音频弄好几份是为了快速打字是，可同时发音
  function setAudio(audioSrcList2: string[], audioFileLength2?: number) {
    //@ts-ignore
    if (import.meta.server) return
    if (audioFileLength2) audioLength.value = audioFileLength2
    audioList.value = []
    for (let i = 0; i < audioLength.value; i++) {
      audioSrcList2.map(src => audioList.value.push(new Audio(withAppBaseURL(ENV.RESOURCE_URL + src))))
    }
    index.value = 0
  }

  function play(volume: number = 100) {
    index.value++
    if (audioList.value.length > 1 && audioList.value.length !== audioLength.value) {
      let htmlAudioElement = audioList.value[index.value % audioList.value.length]
      if (htmlAudioElement) {
        htmlAudioElement.volume = volume / 100
        void htmlAudioElement.play().catch(() => {})
      }
    } else {
      let htmlAudioElement1 = audioList.value[index.value % audioLength.value]
      if (htmlAudioElement1) {
        htmlAudioElement1.volume = volume / 100
        void htmlAudioElement1.play().catch(() => {})
      }
    }
  }

  return { play, setAudio }
}

let keyboardPlayFn: ((volume: number) => void) | null = null
export function usePlayKeyboardAudio() {
  const settingStore = useSettingStore()

  if (!keyboardPlayFn) {
    const { play, setAudio } = useSound()

    watchEffect(() => {
      if (!settingStore.keyboardSound) return
      if (!SoundFileOptions.find(v => v.label === settingStore.keyboardSoundFile)) {
        settingStore.keyboardSoundFile = '机械键盘2'
      }
      let urlList = getAudioFileUrl(settingStore.keyboardSoundFile)
      setAudio(urlList, urlList.length === 1 ? 4 : 1)
    })

    keyboardPlayFn = play
  }

  function playAudio() {
    if (settingStore.keyboardSound) {
      keyboardPlayFn!(settingStore.keyboardSoundVolume)
    }
  }

  return playAudio
}

let playBeep = null
export function usePlayBeep() {
  const settingStore = useSettingStore()
  if (!playBeep) {
    const { play } = useSound([`/sound/beep.wav`], 1)
    playBeep = play
  }

  function playAudio() {
    if (settingStore.effectSound) {
      playBeep(settingStore.effectSoundVolume)
    }
  }

  return playAudio
}

export function usePlayCorrect() {
  const settingStore = useSettingStore()
  const { play } = useSound([`/sound/correct.wav`], 1)

  function playAudio() {
    if (settingStore.effectSound) {
      play(settingStore.effectSoundVolume)
    }
  }

  return playAudio
}

const activeWordPlayCountMap = new Map<string, number>()
let resetWordPlayCountTimer = -1

export function resetActiveWordPlayCount(word: string) {
  if (!word) return
  activeWordPlayCountMap.delete(word.trim().toLowerCase())
}

let dutchPlayer: ReturnType<typeof createDutchAudioPlayer> | undefined
let lastAudioWarning = 0
function getDutchPlayer() {
  dutchPlayer ??= createDutchAudioPlayer({
    source: text => {
      const path = (dutchAudio as Record<string, string>)[normalizeDutchAudioText(text)]
      return path ? withAppBaseURL(path) : undefined
    },
    createAudio: () => {
      const audio = document.createElement('audio')
      audio.id = 'dutch-pronunciation-audio'
      audio.hidden = true
      audio.preload = 'auto'
      document.body.appendChild(audio)
      return audio
    },
    speech: typeof speechSynthesis === 'undefined' ? undefined : speechSynthesis,
    createUtterance: typeof SpeechSynthesisUtterance === 'undefined' ? undefined : text => new SpeechSynthesisUtterance(text),
    onError: hasRecording => {
      if (Date.now() - lastAudioWarning < 5000) return
      lastAudioWarning = Date.now()
      Toast.warning(hasRecording
        ? '音频未能播放，请检查网络和浏览器声音权限后点击重试。'
        : '此自定义文本暂无课程音频，需要设备提供荷兰语语音。课程内置内容可直接播放。', { duration: 6000 })
    },
  })
  return dutchPlayer
}

export function cancelWordPracticeAudio() {
  dutchPlayer?.stop()
}

export function usePlayWordAudio() {
  const settingStore = useSettingStore()
  const speak = useTTsPlayAudio()
  return (word: string, handle = true, onEnd?: () => void, onPlay?: () => void) => {
    cancelWordPracticeAudio()
    const key = word.trim().toLocaleLowerCase('nl')
    const count = activeWordPlayCountMap.get(key) ?? 0
    activeWordPlayCountMap.set(key, count + 1)
    const rate = settingStore.wordSoundSpeed * (handle && count % 3 !== 0 ? 0.75 : 1)
    speak(word, { rate, onEnd, onPlay })
  }
}

export interface TTsPlayOptions {
  rate?: number
  volume?: number
  pitch?: number
  lang?: string
  onEnd?: () => void
  onPlay?: () => void
}

export function useTTsPlayAudio() {
  const settingStore = useSettingStore()
  return (text: string, options: TTsPlayOptions = {}) => {
    const saved = settingStore.ttsVoiceMap?.find(item => item.key === getBrowserKey())?.voice
    getDutchPlayer().play(text, {
      ...options,
      rate: options.rate ?? settingStore.wordSoundSpeed,
      volume: options.volume ?? settingStore.wordSoundVolume / 100,
      voiceName: saved,
      preferredLanguage: settingStore.soundType === 'uk' ? 'nl-BE' : 'nl-NL',
    })
  }
}

export function usePlayAudio(url: string) {
  void new Audio(withAppBaseURL(url)).play().catch(() => {})
}

export function getAudioFileUrl(name: string) {
  if (name === '机械键盘') {
    return [
      `/sound/key-sounds/jixie/机械0.mp3`,
      `/sound/key-sounds/jixie/机械1.mp3`,
      `/sound/key-sounds/jixie/机械2.mp3`,
      `/sound/key-sounds/jixie/机械3.mp3`,
    ]
  } else {
    return [`/sound/key-sounds/${name}.mp3`]
  }
}
