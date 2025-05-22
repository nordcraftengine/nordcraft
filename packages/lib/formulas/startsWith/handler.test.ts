import { describe, expect, test } from 'bun:test'
import handler from './handler'

import fastDeepEqual from 'fast-deep-equal'
;(globalThis as any).toddle = { isEqual: fastDeepEqual }

describe('Formula: Starts with', () => {
  test('should return null if collection is neither string nor array', () => {
    expect(handler([1, '1'], undefined as any)).toBe(null)
  })
  test('should return correct value for regular inputs', () => {
    expect(handler(['test', 'te'], undefined as any)).toEqual(true)
    expect(handler(['test', 'es'], undefined as any)).toEqual(false)
  })
})
