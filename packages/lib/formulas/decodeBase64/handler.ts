import type { FormulaHandler } from '@nordcraft/core'

const handler: FormulaHandler<string> = ([input]) => {
  if (typeof input !== 'string') {
    return null
  }
  // See https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/atob
  const binary = atob(input)
  // Decode the bytes as UTF-8 instead of returning the Latin-1 string produced
  // by `atob`, so that multi-byte characters round-trip correctly.
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export default handler
