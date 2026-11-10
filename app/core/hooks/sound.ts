// Type Dutch adaptation: modified 2026-11-10. Upstream: zyronon/TypeWords, GPL-3.0.
import { selectDutchVoice } from '../utils/dutch'
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

let cachedWordAudio: HTMLAudioElement | null = null
let wordPlaybackGeneration = 0
let ttsPlaybackGeneration = 0

function getCachedWordAudio(): HTMLAudioElement | null {
  if (!cachedWordAudio && typeof Audio !== 'undefined') {
    cachedWordAudio = new Audio()
  }
  return cachedWordAudio
}

export function cancelWordPracticeAudio() {
  wordPlaybackGeneration++
  ttsPlaybackGeneration++
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.pause()
    speechSynthesis.cancel()
  }
  const wordAudio = getCachedWordAudio()
  if (wordAudio) {
    wordAudio.onended = null
    wordAudio.onerror = null
    wordAudio.pause()
    wordAudio.currentTime = 0
  }
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

function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    const voices = speechSynthesis.getVoices()
    if (voices.length) return resolve(voices)
    let timer: ReturnType<typeof setTimeout>
    const done = () => {
      clearTimeout(timer)
      speechSynthesis.removeEventListener('voiceschanged', done)
      resolve(speechSynthesis.getVoices())
    }
    speechSynthesis.addEventListener('voiceschanged', done)
    timer = setTimeout(done, 1500)
  })
}

export interface TTsPlayOptions {
  rate?: number
  volume?: number
  pitch?: number
  lang?: string
  onEnd?: () => void
  onPlay?: () => void
}

let lastVoiceWarning = 0
export function useTTsPlayAudio() {
  const settingStore = useSettingStore()
  return (text: string, options: TTsPlayOptions = {}) => {
    if (!text) { options.onEnd?.(); return }
    if (typeof speechSynthesis === 'undefined') {
      Toast.warning('此浏览器不支持语音。请使用支持荷兰语语音的浏览器。')
      options.onEnd?.()
      return
    }
    const generation = ++ttsPlaybackGeneration
    speechSynthesis.cancel()
    getVoicesAsync().then(voices => {
      if (generation !== ttsPlaybackGeneration) return
      const saved = settingStore.ttsVoiceMap?.find(item => item.key === getBrowserKey())?.voice
      const preferred = settingStore.soundType === 'uk' ? 'nl-BE' : 'nl-NL'
      const voice = selectDutchVoice(voices, saved, preferred)
      if (!voice) {
        if (Date.now() - lastVoiceWarning > 10000) {
          lastVoiceWarning = Date.now()
          Toast.warning('未找到荷兰语语音。请在系统中添加荷兰语语音包，或用 Edge 打开后在「设置 → 音效」中试听。', { duration: 8000 })
        }
        options.onEnd?.()
        return
      }
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = voice.lang
      utterance.voice = voice
      utterance.rate = options.rate ?? settingStore.wordSoundSpeed
      utterance.volume = options.volume ?? settingStore.wordSoundVolume / 100
      utterance.pitch = options.pitch ?? 1
      utterance.onstart = () => { if (generation === ttsPlaybackGeneration) options.onPlay?.() }
      utterance.onend = () => { if (generation === ttsPlaybackGeneration) options.onEnd?.() }
      utterance.onerror = () => { if (generation === ttsPlaybackGeneration) options.onEnd?.() }
      speechSynthesis.speak(utterance)
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
