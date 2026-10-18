import { describe, expect, it } from 'bun:test'
import app from '../index'

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
  it('Should reject requests initiated by another site', async () => {
    const searchParams = new URLSearchParams({
      name: 'hello',
      value: 'world',
    })
    const res = await app.request(
      `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
      { headers: { 'sec-fetch-site': 'cross-site' } },
    )
    expect(res.status).toBe(403)
    expect(res.headers.get('set-cookie')).toBeNull()
    const body = await res.json<{ error: string }>()
    expect(body.error).toBe(
      'Forbidden. This endpoint can only set cookies for same-origin requests.',
    )
  })
  it('Should reject requests from a sibling subdomain (same-site)', async () => {
    const searchParams = new URLSearchParams({
      name: 'hello',
      value: 'world',
    })
    const res = await app.request(
      `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
      { headers: { 'sec-fetch-site': 'same-site' } },
    )
    expect(res.status).toBe(403)
    expect(res.headers.get('set-cookie')).toBeNull()
  })
  it('Should allow requests from the same origin', async () => {
    const searchParams = new URLSearchParams({
      name: 'hello',
      value: 'world',
    })
    const res = await app.request(
      `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
      { headers: { 'sec-fetch-site': 'same-origin' } },
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie')).toContain('hello=world')
  })
  it('Should allow user-initiated (none) requests', async () => {
    const searchParams = new URLSearchParams({
      name: 'hello',
      value: 'world',
    })
    const res = await app.request(
      `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
      { headers: { 'sec-fetch-site': 'none' } },
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie')).toContain('hello=world')
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
