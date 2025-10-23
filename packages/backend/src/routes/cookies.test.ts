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
  it('Should fail for invalid parameters', async () => {
    const searchParams = new URLSearchParams({
      name: 'hello',
    })
    const res = await app.request(
      `/.nordcraft/cookies/set-cookie?${searchParams.toString()}`,
      {},
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Bad request. The value must be of type string.')
  })
})
