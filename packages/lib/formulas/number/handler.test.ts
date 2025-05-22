import { describe, expect, test } from 'bun:test'
import isEqual from 'fast-deep-equal'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Number', () => {
  test('Should turn a string into a number', () => {
    expect(handler(['45'], undefined as any)).toBe(45)
  })

  test('should turn a boolean into a number', () => {
    expect(handler([false], undefined as any)).toBe(0)
    expect(handler([true], undefined as any)).toBe(1)
  })

  test('should return NaN for other values', () => {
    expect(handler(['andreas'], undefined as any)).toBe(NaN)
    expect(handler(['forty five'], undefined as any)).toBe(NaN)
    expect(handler(['45px'], undefined as any)).toBe(NaN)
  })
})
