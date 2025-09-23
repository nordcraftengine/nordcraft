import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<string> = (_, { env }) => {
  if (env.isServer) {
    return env.request.url
  } else {
    // See https://developer.mozilla.org/en-US/docs/Web/API/Window/location
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return window?.location.href ?? null
  }
}
export default handler
