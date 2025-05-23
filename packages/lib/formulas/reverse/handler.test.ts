import { describe, expect, test } from 'bun:test'
import isEqual from 'fast-deep-equal'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Revers', () => {
  test('Should reverse a list', () => {
    expect(handler([[1, 2, 3]], undefined as any)).toEqual([3, 2, 1])
    expect(handler([['A', 'L', 'B']], undefined as any)).toEqual([
      'B',
      'L',
      'A',
    ])
  })
})
