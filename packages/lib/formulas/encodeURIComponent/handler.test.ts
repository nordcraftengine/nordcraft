import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Encode URI Component', () => {
  test('should encode strings', () => {
    const testURI = 'hello+world/this&is#cool'
    const result = handler([testURI], undefined as any)
    expect(result).toBeTruthy()
    expect(result).toBe(encodeURIComponent(testURI))
  })

  test('should return the string itself when decoded', () => {
    const testURI = 'hello+world/this&is#cool'
    const result = handler([testURI], undefined as any)
    expect(decodeURIComponent(result ?? '')).toBe(testURI)
  })

  test('should return null if input is not a string', () => {
    const input = { some: 'object' }
    expect(handler([input], undefined as any)).toBe(null)
    expect(handler([undefined], undefined as any)).toBe(null)
  })
})
