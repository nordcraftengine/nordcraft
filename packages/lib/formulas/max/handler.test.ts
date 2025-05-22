import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Max', () => {
  test('Should return the largest number from a list', () => {
    expect(handler([1, 2, 3], undefined as any)).toBe(3)
  })
})
