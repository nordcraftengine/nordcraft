import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { validateUrl } from '@nordcraft/core/dist/utils/url'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Context } from 'hono'
import type { HonoEnv, HonoProject } from '../../hono'

export const favicon = async (c: Context<HonoEnv<HonoProject>>) => {
  try {
    const iconUrl = applyFormula(
      c.var.config?.meta?.icon?.formula,
      undefined as any,
    )
    const requestUrl = new URL(c.req.url)
    const validIconUrl = validateUrl({
      path: iconUrl,
      origin: requestUrl.origin,
    })
    if (validIconUrl) {
      // return a response with the icon
      const { body, ok, headers: iconHeaders } = await fetch(validIconUrl)
      if (ok && body) {
        c.header('Cache-Control', 'public, max-age=3600')
        const contentType = iconHeaders.get('content-type')
        if (isDefined(contentType)) {
          c.header('Content-Type', contentType)
        }
        return c.body(body)
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
  }
  // If no icon is found or an error occurs, return a 404 with the default favicon content-type
  c.header('Content-Type', 'image/x-icon')
  return c.body(null, 404)
}
