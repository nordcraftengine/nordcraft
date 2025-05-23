import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Last', () => {
  test('the last item of [1, 2, 3] should be 3', () => {
    expect(handler([[1, 2, 3]], undefined as any)).toBe(3)
  })
  test('the first item of "Hi!" should be H', () => {
    expect(handler(['Hi!'], undefined as any)).toBe('!')
  })
})
