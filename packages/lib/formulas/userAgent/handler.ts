import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<string> = (_, { env }) => {
  if (!env.isServer) {
    // See https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent
    return window.navigator.userAgent
  } else {
    // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
    return env.request?.headers['user-agent'] ?? null
  }
}

export default handler
