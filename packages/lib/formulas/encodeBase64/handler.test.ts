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
})
