import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Split', () => {
  // Test that handler returns null with invalid input
  test('Should return a list of strings based on delimiter', () => {
    expect(handler(['Hello world', ' '], undefined as any)).toEqual([
      'Hello',
      'world',
    ])
    expect(handler(['Hello', ''], undefined as any)).toEqual([
      'H',
      'e',
      'l',
      'l',
      'o',
    ])
  })
})
