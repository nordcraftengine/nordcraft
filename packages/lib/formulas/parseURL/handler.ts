import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * Create a simplified URL object similar to the native URL
 * while retaining the original URL object's toString method.
 */
class NCURL {
  hostname: string
  searchParams: {
    [k: string]: string
  }
  path: string[]
  hash: string
  href: string
  protocol: string
  port: string
  origin: string

  constructor(url: URL) {
    this.hostname = url.hostname
    this.searchParams = Object.fromEntries(url.searchParams)
    this.path = url.pathname.split('/').filter((p, i) => i !== 0 || p !== '')
    this.hash = url.hash.replace('#', '')
    this.href = url.href
    this.protocol = url.protocol
    this.port = url.port
    this.origin = url.origin
  }

  toString() {
    // This is the same functionality as URL.prototype.toString (https://developer.mozilla.org/en-US/docs/Web/API/URL#instance_methods)
    return this.href
  }
}

/**
 * Similar to https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
 * but returns searchParams as an object and path as an array without leading empty string
 */
const handler: FormulaHandler<{
  hostname: string
  searchParams: {
    [k: string]: string
  }
  path: string[]
  hash: string
  href: string
  protocol: string
  port: string
  origin: string
}> = ([url, base]) => {
  if (typeof url !== 'string') {
    return null
  }
  try {
    return new NCURL(new URL(url, typeof base === 'string' ? base : undefined))
  } catch {
    // Invalid url
    return null
  }
}
export default handler
