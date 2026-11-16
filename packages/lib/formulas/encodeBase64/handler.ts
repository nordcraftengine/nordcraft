import type { FormulaHandler } from '@nordcraft/core'

// `btoa` only accepts strings where every character fits in a single byte, so
// the input is converted to UTF-8 bytes before being encoded.
const CHUNK_SIZE = 0x8000

const handler: FormulaHandler<string> = ([input]) => {
  if (typeof input !== 'string') {
    return null
  }
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE))
  }
  // See https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa
  return btoa(binary)
}

export default handler
