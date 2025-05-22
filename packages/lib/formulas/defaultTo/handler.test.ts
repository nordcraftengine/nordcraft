import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Default to', () => {
  test('should return the value when it is provided', () => {
    const value = 'some value'
    const defaultValue = 'some default value'
    const result = handler([value, defaultValue], undefined as any)
    expect(result).toEqual(value)
  })

  test('should return the default value when no value is provided', () => {
    const defaultValue = 'some default value'
    expect(handler([null, defaultValue], undefined as any)).toEqual(
      defaultValue,
    )
    expect(handler([undefined, defaultValue], undefined as any)).toEqual(
      defaultValue,
    )
  })

  test('should return the first valid value value when no value is provided', () => {
    const defaultValue = 'some default value'
    expect(handler([null, false, defaultValue], undefined as any)).toEqual(
      defaultValue,
    )
    expect(handler([undefined, null, false], undefined as any)).toEqual(null)
  })
})
