import { describe, expect, test } from 'bun:test'
import { validateUrl } from './url'

describe('validateUrl()', () => {
  test('it validates urls correctly', () => {
    expect(
      validateUrl({ path: 'https://nordcraft.com', origin: undefined }),
    ).toBeInstanceOf(URL)
    expect(validateUrl({ path: 'not-a-url', origin: undefined })).toBe(false)
  })

  test('it validates urls arrays in query params correctly', async () => {
    const url = validateUrl({
      path: 'https://nordcraft.com?test=1&test=2',
      origin: undefined,
    })
    expect(url).toBeInstanceOf(URL)
    if (url instanceof URL) {
      expect(url.searchParams.getAll('test')).toEqual(['1', '2'])
    }
  })

  test('it validates relative urls when a base is provided', () => {
    const url = validateUrl({
      path: '/my-path',
      origin: 'https://nordcraft.com',
    })
    expect(url).toBeInstanceOf(URL)
    expect((url as URL).href).toBe('https://nordcraft.com/my-path')
  })

  test("it ignores the origin if it's part of the path", () => {
    const url = validateUrl({
      path: 'https://nordcraft.com/my-path',
      origin: 'https://otherdomain.com',
    })
    expect(url).toBeInstanceOf(URL)
    expect((url as URL).href).toBe('https://nordcraft.com/my-path')
  })

  test("it doesn't accept relative urls when no base is provided", () => {
    const url = validateUrl({ path: '/my-path', origin: undefined })
    expect(url).toBe(false)
  })
})
