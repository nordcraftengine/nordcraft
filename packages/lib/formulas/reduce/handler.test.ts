import { describe, expect, test } from 'bun:test'
import { deepEqual as isEqual } from 'fast-equals'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Reduce', () => {
  test('Should sum a list of numbers given an accumulator', () => {
    expect(
      handler(
        [[1, 2, 3], (Arg: any) => Arg.result + Arg.item, 0],
        undefined as any,
      ),
    ).toBe(6)
  })
})
