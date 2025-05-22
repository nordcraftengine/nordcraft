import { describe, expect, test } from 'bun:test'
import handler from './handler'

import fastDeepEqual from 'fast-deep-equal'
;(globalThis as any).toddle = { isEqual: fastDeepEqual }

describe('Formula: Take Last', () => {
  test('should return the first n elements', () => {
    expect(handler([[1, 2, 3, 4, 5, 6, 7], 3], undefined as any)).toEqual([
      5, 6, 7,
    ])
    expect(handler([[1, 2, 3, 4, 5, 6, 7], 0], undefined as any)).toEqual([])
    expect(handler([['hello', 'world'], 1], undefined as any)).toEqual([
      'world',
    ])
  })
})
