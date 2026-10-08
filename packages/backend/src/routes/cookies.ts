import { escapeSearchParameters } from '@nordcraft/ssr/dist/rendering/request'
import type { Handler } from 'hono'
import type { HonoEnv } from '../../hono'

export const setCookieHandler: Handler<HonoEnv> = async (ctx) => {
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
  // Browsers cap cookie lifetimes (currently 400 days in Chrome/Firefox per
  // RFC 6265bis). Enforce the same cap server-side so that a forged `exp`
  // claim (or an excessive `ttl`) cannot create a near-permanent cookie.
  const maxLifetimeSeconds = 400 * 24 * 60 * 60
  if (typeof ttl === 'number' && ttl > 0) {
    expirationDate = new Date(
      Date.now() + Math.min(ttl, maxLifetimeSeconds) * 1000,
    )
  } else {
    // If no ttl was provided, in case this is a jwt, we use the expiry date
    // from the payload as a best-effort hint for the cookie lifetime. The
    // payload is NOT signature-verified, so it must never be trusted for
    // identity or access-control decisions - it only bounds how long the
    // cookie itself is stored.
    const accessTokenPayload = decodeUnverifiedToken(value)
    if (typeof accessTokenPayload?.exp === 'number') {
      expirationDate = new Date(
        Math.min(
          accessTokenPayload.exp * 1000,
          Date.now() + maxLifetimeSeconds * 1000,
        ),
      )
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

/**
 * Decodes the payload of a JWT without verifying its signature.
 *
 * WARNING: the returned claims are UNVERIFIED and must never be used for
 * authentication, authorization, or any other identity decision. Anyone can
 * craft a token with arbitrary claims, so a successfully decoded payload
 * proves nothing about the sender. This helper exists solely to extract
 * best-effort metadata, such as the `exp` hint used for cookie lifetimes.
 *
 * Returns the payload when it is a JSON object whose optional `exp` claim
 * is a finite number mapping to a valid date. Returns `undefined` for any
 * malformed input (wrong segment count, invalid base64url, non-object
 * JSON, or an unusable `exp` claim).
 */
export const decodeUnverifiedToken = (
  token?: string,
): ({ exp?: number } & Record<string, unknown>) | undefined => {
  try {
    if (
      typeof token !== 'string' ||
      token.length === 0 ||
      token.length > 8192
    ) {
      return
    }
    // A JWT in compact serialization has exactly three dot-separated
    // segments. The signature may be empty (`alg: none`), but the header
    // and payload must be present.
    const segments = token.split('.')
    if (
      segments.length !== 3 ||
      typeof segments[0] !== 'string' ||
      typeof segments[1] !== 'string' ||
      segments[0].length === 0 ||
      segments[1].length === 0
    ) {
      return
    }
    const payloadJson = base64UrlDecodeToString(segments[1])
    if (payloadJson === undefined) {
      return
    }
    const parsed: unknown = JSON.parse(payloadJson)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return
    }
    const payload = parsed as Record<string, unknown> & { exp?: unknown }
    if (payload.exp !== undefined) {
      if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
        return
      }
      // Reject values that cannot be represented as a cookie expiry date
      // (e.g. magnitudes that produce `Invalid Date`).
      const expiryTime = payload.exp * 1000
      if (
        !Number.isFinite(expiryTime) ||
        Number.isNaN(new Date(expiryTime).getTime())
      ) {
        return
      }
    }
    return payload as { exp?: number } & Record<string, unknown>
  } catch {
    return
  }
}

/**
 * Decodes a base64url-encoded string into UTF-8 text.
 * Returns `undefined` when the input is not valid base64url.
 */
const base64UrlDecodeToString = (input: string): string | undefined => {
  if (!/^[A-Za-z0-9-_]*$/.test(input)) {
    return
  }
  // Restore padding stripped by base64url encoding. A remainder of 1 is
  // never valid base64.
  const remainder = input.length % 4
  if (remainder === 1) {
    return
  }
  const padded = remainder === 0 ? input : input + '='.repeat(4 - remainder)
  try {
    const binary = atob(padded.replaceAll('-', '+').replaceAll('_', '/'))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    // Decode via TextDecoder (rather than using the raw `atob` string) so
    // that multi-byte UTF-8 payloads survive the round-trip.
    return new TextDecoder().decode(bytes)
  } catch {
    return
  }
}

/**
 * @deprecated Use {@link decodeUnverifiedToken} instead. The name makes
 * explicit that the signature is not verified and the claims must not be
 * trusted for identity decisions.
 */
export const decodeToken = decodeUnverifiedToken
