import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Action: Share', () => {
  test('throws for invalid inputs', () => {
    expect(() => handler([-5], undefined as any)).toThrow()
    expect(() => handler([null], undefined as any)).toThrow()
    expect(() => handler([{ foo: 'bar' }], undefined as any)).toThrow()
  })
  test("doesn't throw for valid input", () => {
    expect(() =>
      handler([undefined, 'Test title'], undefined as any),
    ).not.toThrow()
    expect(() =>
      handler(['https://mysite.com'], undefined as any),
    ).not.toThrow()
    expect(() =>
      handler(
        [undefined, undefined, 'This is the text I want to share'],
        undefined as any,
      ),
    ).not.toThrow()
  })
})
