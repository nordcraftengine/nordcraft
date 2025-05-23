import { describe, expect, test } from 'bun:test'
import handler from './handler'

import fastDeepEqual from 'fast-deep-equal'
;(globalThis as any).toddle = { isEqual: fastDeepEqual }

describe('Formula: Square root', () => {
  test('should return the square root', () => {
    expect(handler([4], undefined as any)).toBe(2)
    expect(handler([81], undefined as any)).toBe(9)
  })
})
