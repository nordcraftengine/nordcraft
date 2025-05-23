import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: First', () => {
  test('the first item of [1, 2, 3] should be 1', () => {
    expect(handler([[1, 2, 3]], undefined as any)).toBe(1)
  })
  test('the first item of "Hi" should be H', () => {
    expect(handler(['Hi'], undefined as any)).toBe('H')
  })
})
