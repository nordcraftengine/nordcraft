import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Drop last', () => {
  test('handler returns null when count is not a number', () => {
    expect(handler(['test', 'test'], undefined as any)).toBe(null)
  })

  test('handler returns correct array when list is an array', () => {
    expect(handler([[1, 2, 3], 2], undefined as any)).toEqual([1])
    expect(handler([[1, 2, 3], 1], undefined as any)).toEqual([1, 2])
    expect(handler([[1, 2, 3], 0], undefined as any)).toEqual([1, 2, 3])
  })

  test('handler returns correct string when list is a string', () => {
    expect(handler(['test', 2], undefined as any)).toEqual('te')
    expect(handler(['test', 0], undefined as any)).toEqual('test')
  })

  test('handler returns null when list is not an array or a string', () => {
    expect(handler([1, 2], undefined as any)).toBe(null)
  })
})
