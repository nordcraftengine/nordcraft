import { describe, expect, test } from 'bun:test'
import isEqual from 'fast-deep-equal'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Random number', () => {
  test('Should generate a random number', () => {
    const ref = handler([], undefined as any)
    const res = handler([], undefined as any)
    expect(typeof ref).toBe('number')
    expect(typeof res).toBe('number')
    expect(res).not.toBe(ref)
  })
})
