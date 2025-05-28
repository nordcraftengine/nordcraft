import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Map', () => {
  test('Should return a new list of mapped values', () => {
    expect(
      handler([[1, 2, 3], (Arg: any) => Arg.item + 1], undefined as any),
    ).toEqual([2, 3, 4])
  })
  test('Should provide index value to mapping formula', () => {
    expect(
      handler(
        [['hello', 'world', '!'], (Arg: any) => Arg.index],
        undefined as any,
      ),
    ).toEqual([0, 1, 2])
  })
  test('Should work for objects', () => {
    expect(
      handler(
        [
          { name: 'Andreas', role: 'Admin' },
          (Arg: any) => ({ ...Arg, value: Arg.value.toLocaleLowerCase() }),
        ],
        undefined as any,
      ),
    ).toEqual({ name: 'andreas', role: 'admin' })
  })
})
