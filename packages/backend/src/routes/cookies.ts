import { escapeSearchParameters } from '@nordcraft/ssr/dist/rendering/request'
import type { Handler } from 'hono'
import type { HonoEnv } from '../../hono'

export const setCookieHandler: Handler<HonoEnv> = async (ctx) => {
  // Never set cookies based on requests initiated by other sites. Without this
  // check, any website can link a visitor to this endpoint and have the browser
  // store an arbitrary (HttpOnly) cookie for this site, e.g. to log the visitor
  // into an attacker's account or delete an existing session cookie.
  // The Set HttpOnly Cookie action calls this endpoint from the same origin, so
  // it is unaffected. Requests without the header (older browsers, non-browser
  // clients) are allowed as they cannot be attributed to a specific site.
  const secFetchSite = ctx.req.header('sec-fetch-site')?.toLowerCase()
  if (
    secFetchSite !== undefined &&
    secFetchSite !== '' &&
    secFetchSite !== 'same-origin' &&
    secFetchSite !== 'none'
  ) {
    return ctx.json(
      {
        error:
          'Forbidden. This endpoint can only set cookies for same-origin requests.',
      },
      403,
    )
  }
  const url = new URL(ctx.req.url)
  const searchParameters = escapeSearchParameters(url.searchParams)
  const name = searchParameters.get('name')
  const value = searchParameters.get('value')
  const sameSite = searchParameters.get('sameSite') ?? 'Lax'
  const path = searchParameters.get('path') ?? '/'
  const _ttl = searchParameters.get('ttl')
  const includeSubdomains =
    searchParameters.get('includeSubdomains') !== 'false' // default to true

  if (typeof name !== 'string' || name === '') {
    return ctx.json(
      { error: `Bad request. The name must be of type string.` },
      400,
    )
  }
  if (typeof value !== 'string') {
    return ctx.json(
      { error: `Bad request. The value must be of type string.` },
      400,
    )
  }
  if (['lax', 'strict', 'none'].includes(sameSite.toLowerCase()) === false) {
    return ctx.json(
      { error: `Bad request. The sameSite must be "Lax", "Strict" or "None".` },
      400,
    )
  }
  if (typeof path !== 'string' || !path.startsWith('/')) {
    return ctx.json(
      {
        error: `Bad request. The path must be of type string and start with /.`,
      },
      400,
    )
  }
  let ttl: number | undefined
  if (typeof _ttl === 'string') {
    ttl = Number(_ttl)
    if (isNaN(ttl)) {
      return ctx.json(
        { error: `Bad request. The ttl must be a valid number.` },
        400,
      )
    }
  }

  let expirationDate: Date | undefined
  if (typeof ttl === 'number' && ttl > 0) {
    expirationDate = new Date(Date.now() + ttl * 1000)
  } else {
    // If no ttl was provided, in case this is a jwt, we determine the expiry date from the payload
    const accessTokenPayload = decodeToken(value)
    if (typeof accessTokenPayload?.exp === 'number') {
      expirationDate = new Date(accessTokenPayload.exp * 1000)
    }
  }

  // We will always set the cookie to Secure and HttpOnly. Anything else can be configured
  const cookieParts = [
    `${name}=${value}`,
    'Secure',
    'HttpOnly',
    `SameSite=${sameSite}`,
    `Path=${path}`,
  ]
  if (expirationDate) {
    cookieParts.push(`Expires=${expirationDate.toUTCString()}`)
  } else if (ttl === 0) {
    cookieParts.push('Max-Age=0') // Delete the cookie
  }
  if (includeSubdomains) {
    // When the domain is set, the cookie is also available to subdomains - otherwise
    // it is only available on the current domain
    cookieParts.push(`Domain=${url.hostname}`)
  }
  ctx.header('Set-Cookie', cookieParts.join('; '))
  return ctx.body(null, 200)
}

export const decodeToken = (token?: string) => {
  try {
    if (typeof token !== 'string') {
      return
    }
    // Replace Base64url encoding characters
    const jwtUrlSafe = token.replaceAll('-', '+').replaceAll('_', '/')
    const [, payload] = jwtUrlSafe.split('.')
    if (typeof payload !== 'string') {
      return
    }
    const user = atob(payload)
    return JSON.parse(user) as { exp?: number }
  } catch {
    return
  }
}
