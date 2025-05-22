import { describe, expect, test } from 'bun:test'
import handler from './handler'

import fastDeepEqual from 'fast-deep-equal'
;(globalThis as any).toddle = { isEqual: fastDeepEqual }

describe('Formula: Includes', () => {
  test('should return null if collection is neither string nor array', () => {
    expect(handler([1, '1'], undefined as any)).toBe(null)
  })
  test('should return correct value for regular inputs', () => {
    expect(handler(['test', 'es'], undefined as any)).toEqual(true)
    expect(handler([[1, 2, 3], 3], undefined as any)).toEqual(true)
    expect(handler(['test', 'xyz'], undefined as any)).toEqual(false)
    expect(handler([[1, 2, 3], 4], undefined as any)).toEqual(false)
  })
})
