import { describe, expect, test } from 'bun:test'
import isEqual from 'fast-deep-equal'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Equals', () => {
  test('Should return true for simple values', () => {
    expect(handler(['test', 'test'], undefined as any)).toBe(true)
    expect(handler([1, 1], undefined as any)).toBe(true)
    expect(handler([null, null], undefined as any)).toBe(true)
  })

  test('should return false when comparing different types', () => {
    expect(handler(['2', 2], undefined as any)).toBe(false)
    expect(handler(['', null], undefined as any)).toBe(false)
    expect(handler(['', false], undefined as any)).toBe(false)
    expect(handler(['false', false], undefined as any)).toBe(false)
  })

  test('handler return true when object are structually equal', () => {
    expect(handler([{}, {}], undefined as any)).toBe(true)
    expect(
      handler(
        [
          [1, 2, 3],
          [1, 2, 3],
        ],
        undefined as any,
      ),
    ).toBe(true)
    expect(
      handler([{ name: 'Andreas' }, { name: 'Andreas' }], undefined as any),
    ).toBe(true)
    expect(
      handler([[{ name: 'Andreas' }], [{ name: 'Andreas' }]], undefined as any),
    ).toBe(true)
  })
})
