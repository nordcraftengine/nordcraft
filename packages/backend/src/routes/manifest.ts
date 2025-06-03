import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { validateUrl } from '@nordcraft/core/dist/utils/url'
import type { Context } from 'hono'
import { stream } from 'hono/streaming'
import type { HonoEnv, HonoProject } from '../../hono'

const MANIFEST_CONTENT_TYPE = 'application/manifest+json'

export const manifest = async (c: Context<HonoEnv<HonoProject>>) => {
  try {
    const manifestUrl = applyFormula(
      c.var.config?.meta?.manifest?.formula,
      undefined as any,
    )
    const requestUrl = new URL(c.req.url)
    const validManifestUrl = validateUrl({
      path: manifestUrl,
      origin: requestUrl.origin,
    })
    if (validManifestUrl) {
      // return a (streamed) response with the body from the manifest file
      const { body, ok } = await fetch(validManifestUrl)
      if (ok && body) {
        c.header('Content-Type', MANIFEST_CONTENT_TYPE)
        c.header('Cache-Control', `public, max-age=3600`)
        return stream(c, (s) => s.pipe(body as any))
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
  }
  return new Response(null, { status: 404 })
}
