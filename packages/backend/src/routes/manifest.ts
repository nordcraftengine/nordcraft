import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { validateUrl } from '@nordcraft/core/dist/utils/url'
import type { Context } from 'hono'
import type { HonoEnv, HonoProject } from '../../hono'

const MANIFEST_CONTENT_TYPE = 'application/manifest+json'

export const manifest = async (c: Context<HonoEnv<HonoProject>>) => {
  c.header('Content-Type', MANIFEST_CONTENT_TYPE)
  try {
    const manifestUrl = applyFormula(
      c.var.config?.meta?.manifest?.formula,
      undefined as any,
    )
    const validManifestUrl = validateUrl(manifestUrl)
    if (typeof validManifestUrl === 'string') {
      // return a (streamed) response with the body from the manifest file
      const { body, ok } = await fetch(manifestUrl)
      if (ok && body) {
        c.header('Cache-Control', `public, max-age=3600`)
        return c.body(body)
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
  }
  return c.body(null, 404)
}
