import { applyFormula, isDefined, validateUrl } from '@nordcraft/core'
import type { Context } from 'hono'
import type { HonoEnv, HonoProject } from '../../hono'

export const serviceWorker = async (c: Context<HonoEnv<HonoProject>>) => {
  c.header('Content-Type', 'text/javascript')
  try {
    const config = c.var.config
    const serviceWorkerUrl = isDefined(config?.meta?.serviceWorker)
      ? // We don't need to provide a context for applyFormula, as the formula should just be a value formula
        applyFormula(
          config.meta.serviceWorker.formula,
          undefined as any,
          undefined,
        )
      : undefined
    const url = validateUrl(serviceWorkerUrl)
    if (url) {
      // return a response with the body from the service worker
      const { body, ok } = await fetch(url)
      if (ok && body) {
        return c.body(body)
      }
    }
    return c.body(null, 404)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
  }
  return c.body(null, 404)
}
