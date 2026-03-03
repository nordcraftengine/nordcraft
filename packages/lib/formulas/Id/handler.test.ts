import { describe, expect, test } from 'bun:test'
import isEqual from 'fast-deep-equal'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Id', () => {
  test('Should generate a unique number', () => {
    const ref = handler([], undefined as any)
    const res = handler([], undefined as any)
    expect(typeof ref).toBe('string')
    expect(typeof res).toBe('string')
    expect(res).not.toBe(ref)
  })
})
