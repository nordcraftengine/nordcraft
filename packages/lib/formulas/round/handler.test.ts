import { describe, expect, test } from 'bun:test'
import isEqual from 'fast-deep-equal'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Round', () => {
  test('Should round a number', () => {
    expect(handler([1.2, 0], undefined as any)).toBe(1)
    expect(handler([1.5, 0], undefined as any)).toBe(2)
  })
  test('Should round to a specific decimal point', () => {
    expect(handler([1.2345, 2], undefined as any)).toBe(1.23)
    expect(handler([1.2345, 3], undefined as any)).toBe(1.235)
  })
})
