import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Absolute', () => {
  test('the absolute value of a negative number should be positive', () => {
    expect(handler([-5], undefined as any)).toBe(5)
  })
  test('the absolute value of a positive number should be the number itself', () => {
    expect(handler([4], undefined as any)).toBe(4)
  })
})
