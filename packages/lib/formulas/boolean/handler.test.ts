import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Boolean', () => {
  test('returns a truthy value for a truthy input', () => {
    expect(handler([[1]], undefined as any)).toBe(true)
    expect(handler([[true]], undefined as any)).toBe(true)
  })
  test('returns a falsy value for a falsy input', () => {
    expect(handler([['']], undefined as any)).toBe(true)
    expect(handler([[0]], undefined as any)).toBe(true)
    expect(handler([[false]], undefined as any)).toBe(true)
    expect(handler([{ key: 'value' }], undefined as any)).toBe(true)
  })
})
