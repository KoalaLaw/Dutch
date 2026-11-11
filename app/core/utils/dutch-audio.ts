import { selectDutchVoice } from './dutch.ts'

export function normalizeDutchAudioText(text: string) {
  return text.normalize('NFC').replace(/[‘’‚‛]/g, "'").replace(/[“”„‟]/g, '"')
    .replace(/\s+/g, ' ').trim().toLocaleLowerCase('nl')
}

export interface DutchPlaybackOptions {
  rate?: number
  volume?: number
  pitch?: number
  voiceName?: string
  preferredLanguage?: string
  onEnd?: () => void
  onPlay?: () => void
}

interface AudioRuntime {
  source: (text: string) => string | undefined
  createAudio: () => HTMLAudioElement
  speech?: SpeechSynthesis
  createUtterance?: (text: string) => SpeechSynthesisUtterance
  onError?: (hasRecording: boolean) => void
}

/** One shared channel: replacement/cancellation must never advance an old exercise. */
export function createDutchAudioPlayer(runtime: AudioRuntime) {
  let audio: HTMLAudioElement | undefined
  let utterance: SpeechSynthesisUtterance | undefined
  let generation = 0
  let clearVoiceWait: (() => void) | undefined

  function stop() {
    generation++
    clearVoiceWait?.()
    clearVoiceWait = undefined
    runtime.speech?.cancel()
    utterance = undefined
    if (audio) {
      audio.onplaying = audio.onended = audio.onerror = null
      audio.pause()
      audio.currentTime = 0
    }
  }

  function play(text: string, options: DutchPlaybackOptions = {}) {
    stop()
    const job = generation
    const src = runtime.source(text)
    let finished = false
    const current = () => job === generation && !finished
    const end = () => { if (current()) { finished = true; options.onEnd?.() } }
    const failed = () => { if (current()) { runtime.onError?.(!!src); end() } }
    if (!text.trim()) { end(); return }

    const playNative = () => {
      if (!current()) return
      const speech = runtime.speech
      if (!speech || !runtime.createUtterance) { failed(); return }
      const speak = () => {
        clearVoiceWait?.()
        clearVoiceWait = undefined
        if (!current()) return
        const voice = selectDutchVoice(speech.getVoices(), options.voiceName, options.preferredLanguage)
        if (!voice) { failed(); return }
        utterance = runtime.createUtterance!(text)
        utterance.lang = voice.lang
        utterance.voice = voice
        utterance.rate = options.rate ?? 1
        utterance.volume = Math.min(1, Math.max(0, options.volume ?? 1))
        utterance.pitch = options.pitch ?? 1
        utterance.onstart = () => { if (current()) options.onPlay?.() }
        utterance.onend = end
        utterance.onerror = failed
        // cancel() does not reset the paused flag in all browsers.
        speech.resume()
        speech.speak(utterance)
      }
      if (speech.getVoices().length) { speak(); return }
      const timer = setTimeout(speak, 1500)
      speech.addEventListener('voiceschanged', speak)
      clearVoiceWait = () => {
        clearTimeout(timer)
        speech.removeEventListener('voiceschanged', speak)
      }
    }

    if (!src) { playNative(); return }
    // Start in the click event: no voice loading or network API before play().
    audio ??= runtime.createAudio()
    const element = audio
    let fallingBack = false
    const fallback = () => {
      if (!current() || fallingBack) return
      fallingBack = true
      element.onplaying = element.onended = element.onerror = null
      element.pause()
      playNative()
    }
    element.src = src
    element.volume = Math.min(1, Math.max(0, options.volume ?? 1))
    element.playbackRate = Math.min(3, Math.max(0.5, options.rate ?? 1))
    element.onplaying = () => { if (current()) options.onPlay?.() }
    element.onended = end
    element.onerror = fallback
    try { void element.play().catch(fallback) } catch { fallback() }
  }

  return { play, stop }
}
