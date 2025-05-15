import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { validateUrl } from '@nordcraft/core/dist/utils/url'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Context } from 'hono'
import { stream } from 'hono/streaming'
import type { HonoEnv } from '../../hono'

export const favicon = async (c: Context<HonoEnv>) => {
  try {
    const iconUrl = applyFormula(
      c.var.project.files.config?.meta?.icon?.formula,
      undefined as any,
    )
    const requestUrl = new URL(c.req.url)
    const validIconUrl = validateUrl({
      path: iconUrl,
      origin: requestUrl.origin,
    })
    if (validIconUrl) {
      // return a (streamed) response with the icon
      const { body, ok, headers: iconHeaders } = await fetch(validIconUrl)
      if (ok && body) {
        c.header('Cache-Control', 'public, max-age=3600')
        const contentType = iconHeaders.get('content-type')
        if (isDefined(contentType)) {
          c.header('Content-Type', contentType)
        }
        return stream(c, (s) => s.pipe(body as any))
      }
    }
  } catch (e) {
    console.error(e)
  }
  return new Response(null, { status: 404 })
}
