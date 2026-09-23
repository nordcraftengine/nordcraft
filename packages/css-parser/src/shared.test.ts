import { describe, expect, test } from 'bun:test'
import { isColor } from './shared'

describe('isColor', () => {
  test('Validates colors correctly', () => {
    // Valid colors
    expect(isColor('hotpink')).toEqual(true)
    expect(isColor('#fff')).toEqual(true)
    expect(isColor('rgb(121, 48, 48)')).toEqual(true)
    // Invalid colors
    expect(isColor('not a color')).toEqual(false)
  })
})
