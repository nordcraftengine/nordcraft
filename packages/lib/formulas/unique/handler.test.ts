import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Unique', () => {
  test('The unique list of [1, 2, 3, 3, 4] should be [1, 2, 3, 4]', () => {
    expect(handler([[1, 2, 3, 3, 4]], undefined as any)).toStrictEqual([
      1, 2, 3, 4,
    ])
  })
  test('The unique list of [{hello:"world"}, {hello:"world"}] should be [{hello:"world"}]', () => {
    expect(
      handler([[{ hello: 'world' }, { hello: 'world' }]], undefined as any),
    ).toStrictEqual([{ hello: 'world' }])
  })
})
