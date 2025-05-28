import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Some', () => {
  // Test that handler returns null with invalid input
  test('Should return true if some items return true', () => {
    expect(
      handler([[1, 2, 3], (Arg: any) => Arg.item === 2], undefined as any),
    ).toBe(true)
    expect(
      handler([[1, 2, 3], (Arg: any) => Arg.item > 0], undefined as any),
    ).toBe(true)
  })
  test('Should return false if some items return false', () => {
    expect(
      handler([[1, 2, 3], (Arg: any) => Arg.item === 4], undefined as any),
    ).toBe(false)
    expect(
      handler([[1, 2, 3], (Arg: any) => Arg.item > 3], undefined as any),
    ).toBe(false)
  })
})
