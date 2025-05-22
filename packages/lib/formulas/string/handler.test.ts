import { describe, expect, test } from 'bun:test'
import handler from './handler'

import fastDeepEqual from 'fast-deep-equal'
;(globalThis as any).toddle = { isEqual: fastDeepEqual }

describe('Formula: String', () => {
  test('should convert the input to a string', () => {
    expect(handler([[1, 2, 3]], undefined as any)).toBe('1,2,3')
    expect(handler([23], undefined as any)).toBe('23')
    expect(handler([true], undefined as any)).toBe('true')
  })
})
