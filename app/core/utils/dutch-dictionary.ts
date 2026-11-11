/** Dutch is explicit at every external lookup entry point, including homographs. */
export function dutchHeadword(text: string) {
  const word = text.normalize('NFC').replace(/[’‘]/g, "'").trim()
    .replace(/^[\s“”".,!?;:()[\]{}]+|[\s“”".,!?;:()[\]{}]+$/gu, '')
    .replace(/\s+/g, ' ').toLocaleLowerCase('nl')
  return word.replace(/^(?:de|het) (?=[\p{L}\p{M}-]+$)/u, '')
}

export function dutchDictionaryURL(text: string) {
  return `https://www.woorden.org/woord/${encodeURIComponent(dutchHeadword(text))}`
}

export function dutchTranslationURL(text: string) {
  return `https://translate.google.com/?sl=nl&tl=zh-CN&text=${encodeURIComponent(text.normalize('NFC').trim())}&op=translate`
}

export function dutchDictionaryLinks(text: string) {
  return [
    { label: '荷兰语 → 中文', href: dutchTranslationURL(text) },
    { label: '荷兰语释义 · Woorden.org', href: dutchDictionaryURL(text) },
    { label: '荷兰语维基词典', href: `https://nl.wiktionary.org/wiki/${encodeURIComponent(dutchHeadword(text))}#Nederlands` },
  ]
}
