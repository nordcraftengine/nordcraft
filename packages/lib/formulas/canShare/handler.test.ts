import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Action: Can Share', () => {
  test('throws for invalid inputs', () => {
    expect(handler([-5], undefined as any)).toEqual(false)
    expect(handler([null], undefined as any)).toEqual(false)
    expect(handler([{ foo: 'bar' }], undefined as any)).toEqual(false)
  })
})
