export interface DutchToken {
  word: string
  nextSpace: boolean
  kind: 'word' | 'number' | 'symbol'
}

// Unicode letters and combining marks keep tweeën, ideeën and café intact.
export function tokenizeDutchSentence(input: string): DutchToken[] {
  const text = input.normalize('NFC').replace(/[‘’‚‛]/g, "'").replace(/[“”„‟]/g, '"')
  const matches = [...text.matchAll(/[€$£¥]?\d+(?:[.,]\d+)*(?:%)?|[\p{L}\p{M}]+(?:\.[\p{L}\p{M}]+)+\.?|[\p{L}\p{M}\p{N}]+(?:['-][\p{L}\p{M}\p{N}]+)*|[^\s]/gu)]
  return matches.map((match, index) => {
    const end = match.index! + match[0].length
    const next = matches[index + 1]?.index ?? text.length
    const word = match[0]
    return { word, nextSpace: /\s/.test(text.slice(end, next)),
      kind: /^\p{L}/u.test(word) ? 'word' : /^[€$£¥]?\d/.test(word) ? 'number' : 'symbol' }
  })
}
