import { describe, expect, it } from 'bun:test'
import app from '../index'
import { decodeToken, decodeUnverifiedToken } from './cookies'

const base64UrlEncode = (value: string) =>
  Buffer.from(value, 'utf8').toString('base64url')

const makeJwt = (payload: unknown, signature = 'forged-signature') => {
  const header = base64UrlEncode(JSON.stringify({ alg: 'none' }))
  const body = base64UrlEncode(
    typeof payload === 'string' ? payload : JSON.stringify(payload),
  )
  return `${header}.${body}.${signature}`
}

const getExpires = (header: string | null) => {
  const part = header
    ?.split('; ')
    .find((cookiePart) => cookiePart.startsWith('Expires='))
  if (!part) {
    return
  }
  return new Date(part.slice('Expires='.length)).getTime()
}

describe('Set cookie', () => {
  it('Should return a valid set-cookie header', async () => {
    const searchParams = new URLSearchParams({
      name: 'hello',
      value: 'world',
    })
    const res = await app.request(
      `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
      {},
    )
    expect(res.status).toBe(200)
    const header = res.headers.get('set-cookie')
    const parts = header?.split('; ') ?? []
    expect(parts).toContain('hello=world')
    expect(parts).toContain('SameSite=Lax')
    expect(parts).toContain('Path=/')
    expect(parts).toContain('Secure')
    expect(parts).toContain('HttpOnly')
    expect(parts.some((part) => part.startsWith('Expires='))).toBe(false)
  })
  it('Should respect ttl setting for a valid set-cookie header', async () => {
    const searchParams = new URLSearchParams({
      name: 'hello',
      value: 'world',
      ttl: '3600', // 1 hour in seconds
    })
    const res = await app.request(
      `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
      {},
    )
    expect(res.status).toBe(200)
    const header = res.headers.get('set-cookie')
    const parts = header?.split('; ') ?? []
    expect(parts).toContain('hello=world')
    expect(parts).toContain('SameSite=Lax')
    expect(parts).toContain('Path=/')
    expect(parts).toContain('Secure')
    expect(parts).toContain('HttpOnly')
    expect(parts.some((part) => part.startsWith('Expires='))).toBe(true)
  })
  it('Should allow deleting a cookie by setting ttl to 0', async () => {
    const searchParams = new URLSearchParams({
      name: 'hello',
      value: 'world',
      ttl: '0',
    })
    const res = await app.request(
      `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
      {},
    )
    expect(res.status).toBe(200)
    const header = res.headers.get('set-cookie')
    const parts = header?.split('; ') ?? []
    expect(parts).toContain('hello=world')
    expect(parts).toContain('SameSite=Lax')
    expect(parts).toContain('Path=/')
    expect(parts).toContain('Secure')
    expect(parts).toContain('HttpOnly')
    expect(parts).toContain('Max-Age=0')
  })
  it('Should fail for invalid parameters', async () => {
    const searchParams = new URLSearchParams({
      name: 'hello',
    })
    const res = await app.request(
      `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
      {},
    )
    expect(res.status).toBe(400)
    const body = await res.json<{ error: string }>()
    expect(body.error).toBe('Bad request. The value must be of type string.')
  })
})

describe('Set cookie with JWT expiry hint', () => {
  it('Should use a well-formed exp claim for the cookie expiry', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    const searchParams = new URLSearchParams({
      name: 'session',
      value: makeJwt({ exp }),
    })
    const res = await app.request(
      `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
      {},
    )
    expect(res.status).toBe(200)
    const expires = getExpires(res.headers.get('set-cookie'))
    expect(expires).toBeDefined()
    // Expires is serialized with 1-second resolution
    expect(Math.abs((expires ?? 0) - exp * 1000)).toBeLessThan(2000)
  })
  it('Should cap a forged far-future exp claim at the maximum cookie lifetime', async () => {
    const tenYearsFromNow = Math.floor(Date.now() / 1000) + 10 * 365 * 86400
    const searchParams = new URLSearchParams({
      name: 'session',
      value: makeJwt({ exp: tenYearsFromNow }),
    })
    const res = await app.request(
      `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
      {},
    )
    expect(res.status).toBe(200)
    const expires = getExpires(res.headers.get('set-cookie'))
    expect(expires).toBeDefined()
    const maxLifetimeMs = 400 * 86400 * 1000
    expect(expires ?? 0).toBeLessThanOrEqual(Date.now() + maxLifetimeMs + 5000)
    expect(expires ?? 0).toBeGreaterThan(Date.now() + maxLifetimeMs - 60000)
  })
  it('Should cap an excessive ttl at the maximum cookie lifetime', async () => {
    const searchParams = new URLSearchParams({
      name: 'session',
      value: 'world',
      ttl: String(10 * 365 * 86400), // 10 years in seconds
    })
    const res = await app.request(
      `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
      {},
    )
    expect(res.status).toBe(200)
    const expires = getExpires(res.headers.get('set-cookie'))
    expect(expires).toBeDefined()
    const maxLifetimeMs = 400 * 86400 * 1000
    expect(expires ?? 0).toBeLessThanOrEqual(Date.now() + maxLifetimeMs + 5000)
  })
  it('Should not set an expiry for malformed tokens', async () => {
    const malformedValues = [
      'world', // not a JWT at all
      'only-one-segment',
      'two.segments', // missing signature segment
      'a.b.c.d', // too many segments
      '.payload.signature', // missing header
      makeJwt({ exp: 'tomorrow' }), // non-numeric exp
      makeJwt({ exp: 1e20 }), // exp that cannot be a date
      makeJwt({ exp: Number.NaN }),
      makeJwt([1, 2, 3]), // non-object payload
      makeJwt('just a string'), // non-object payload
      `${base64UrlEncode('{}')}.!!!.sig`, // invalid base64url payload
    ]
    for (const value of malformedValues) {
      const searchParams = new URLSearchParams({ name: 'session', value })
      const res = await app.request(
        `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
        {},
      )
      expect(res.status).toBe(200)
      expect(getExpires(res.headers.get('set-cookie'))).toBeUndefined()
    }
  })
  it('Should decode unpadded base64url payloads containing unicode', async () => {
    const exp = Math.floor(Date.now() / 1000) + 7200
    const searchParams = new URLSearchParams({
      name: 'session',
      value: makeJwt({ exp, name: 'Jürgen 🚀' }),
    })
    const res = await app.request(
      `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
      {},
    )
    expect(res.status).toBe(200)
    const expires = getExpires(res.headers.get('set-cookie'))
    expect(expires).toBeDefined()
    expect(Math.abs((expires ?? 0) - exp * 1000)).toBeLessThan(2000)
  })
})

describe('decodeUnverifiedToken', () => {
  it('Should decode a well-formed payload without verifying the signature', () => {
    const exp = Math.floor(Date.now() / 1000) + 60
    const payload = decodeUnverifiedToken(makeJwt({ exp, sub: 'user-1' }))
    expect(payload?.exp).toBe(exp)
    expect(payload?.['sub']).toBe('user-1')
  })
  it('Should accept tokens without a signature segment', () => {
    const header = base64UrlEncode(JSON.stringify({ alg: 'none' }))
    const body = base64UrlEncode(JSON.stringify({ exp: 123 }))
    expect(decodeUnverifiedToken(`${header}.${body}.`)?.exp).toBe(123)
  })
  it('Should reject malformed input', () => {
    expect(decodeUnverifiedToken()).toBeUndefined()
    expect(decodeUnverifiedToken('')).toBeUndefined()
    expect(decodeUnverifiedToken('not-a-jwt')).toBeUndefined()
    expect(decodeUnverifiedToken('two.parts')).toBeUndefined()
    expect(decodeUnverifiedToken('x'.repeat(9000))).toBeUndefined()
  })
  it('Should keep the deprecated decodeToken alias working', () => {
    expect(decodeToken(makeJwt({ exp: 42 }))?.exp).toBe(42)
    expect(decodeToken('garbage')).toBeUndefined()
  })
})
