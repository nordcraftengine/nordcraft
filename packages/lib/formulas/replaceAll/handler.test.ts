import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Replace all', () => {
  test('should replace all occurrences in a string', () => {
    expect(
      handler(['Hello world, world', 'world', 'universe'], undefined as any),
    ).toBe('Hello universe, universe')
  })

  test('should return null if the input is not a string', () => {
    expect(handler([1, 'a', 'b'], undefined as any)).toBe(null)
  })

  test('should return null if the search value is not a string', () => {
    expect(handler(['a', 1, 'b'], undefined as any)).toBe(null)
  })

  test('should cast to string if the replace value is not a string', () => {
    expect(handler(['Hello world', 'world', 1], undefined as any)).toBe(
      'Hello 1',
    )
  })
})
