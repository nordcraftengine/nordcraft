import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Decode URI Component', () => {
  test('should decode strings', () => {
    const testURI = 'hello%2Bworld%2Fthis%26is%23cool'
    const result = handler([testURI], undefined as any)
    expect(result).toBeTruthy()
    expect(result).toBe(decodeURIComponent(testURI))
  })

  test('should return the string itself when decoded', () => {
    const testURI = 'hello%2Bworld%2Fthis%26is%23cool'
    const result = handler([testURI], undefined as any)
    expect(encodeURIComponent(result ?? '')).toBe(testURI)
  })

  test('should return null if input is not a string', () => {
    const input = { some: 'object' }
    expect(handler([input], undefined as any)).toBe(null)
    expect(handler([undefined], undefined as any)).toBe(null)
  })
})
