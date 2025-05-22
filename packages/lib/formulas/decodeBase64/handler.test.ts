import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Encode to base64', () => {
  test('should work for simple strings', () => {
    expect(handler(['aGVsbG8gd29ybGQ='], undefined as any)).toBe('hello world')
  })
  test('should work for base64 encoded strings', () => {
    expect(handler(['U0dWc2JHOGdkMjl5YkdRPQ=='], undefined as any)).toBe(
      'SGVsbG8gd29ybGQ=',
    )
  })
})
