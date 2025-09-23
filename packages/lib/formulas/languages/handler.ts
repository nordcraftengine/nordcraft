import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<readonly string[]> = (_, { env }) => {
  if (!env.isServer) {
    // See https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages
    return window.navigator.languages
  } else {
    return (
      // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language
      env.request?.headers['accept-language']
        ?.split(',')
        .map((lang) => lang.split(';')[0]) ?? []
    )
  }
}

export default handler
