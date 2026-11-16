import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Encode to base64', () => {
  test('should work for simple strings', () => {
    expect(handler(['hello world'], undefined as any)).toBe('aGVsbG8gd29ybGQ=')
  })
  test('should work for base64 encoded strings', () => {
    expect(handler(['SGVsbG8gd29ybGQ='], undefined as any)).toBe(
      'U0dWc2JHOGdkMjl5YkdRPQ==',
    )
  })
  test('should encode utf-8 strings', () => {
    expect(handler(['café'], undefined as any)).toBe('Y2Fmw6k=')
  })
  test('should encode characters outside of the Latin-1 range', () => {
    expect(handler(['€'], undefined as any)).toBe('4oKs')
  })
  test('should encode multi-byte characters', () => {
    expect(handler(['👋'], undefined as any)).toBe('8J+Riw==')
  })
  test('should return null for non-string input', () => {
    expect(handler([42], undefined as any)).toBeNull()
  })
})
