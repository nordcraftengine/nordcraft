import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Decode base64', () => {
  test('should work for simple strings', () => {
    expect(handler(['aGVsbG8gd29ybGQ='], undefined as any)).toBe('hello world')
  })
  test('should work for base64 encoded strings', () => {
    expect(handler(['U0dWc2JHOGdkMjl5YkdRPQ=='], undefined as any)).toBe(
      'SGVsbG8gd29ybGQ=',
    )
  })
  test('should decode utf-8 strings', () => {
    expect(handler(['Y2Fmw6k='], undefined as any)).toBe('café')
  })
  test('should decode characters outside of the Latin-1 range', () => {
    expect(handler(['4oKs'], undefined as any)).toBe('€')
  })
  test('should decode multi-byte characters', () => {
    expect(handler(['8J+Riw=='], undefined as any)).toBe('👋')
  })
  test('should return null for non-string input', () => {
    expect(handler([42], undefined as any)).toBeNull()
  })
})
