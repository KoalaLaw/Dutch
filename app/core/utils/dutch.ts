export interface DutchVoice { name: string; lang: string }

export function selectDutchVoice<T extends DutchVoice>(voices: T[], savedName?: string, preferredLanguage = 'nl-NL'): T | undefined {
  const dutch = voices.filter(voice => /^nl(?:-|_)/i.test(voice.lang) || voice.lang.toLowerCase() === 'nl')
  return dutch.find(voice => voice.name === savedName)
    ?? dutch.find(voice => voice.lang.toLowerCase() === preferredLanguage.toLowerCase())
    ?? dutch[0]
}

export function normalizeDutchInput(text: string) {
  return text.normalize('NFC').replace(/[’‘]/g, "'").trim().toLocaleLowerCase('nl')
}

export function isDutchPrintableKey(key: string) {
  return /^[\p{L}\p{M}]$/u.test(key)
}
