import { describe, expect, test } from 'bun:test'
import {
  applySlotSuffix,
  buildSlotSuffix,
  childPath,
  parseRepeatSuffix,
  repeatPath,
  slotBasePath,
} from './nodePath'

describe('nodePath (stable data-id contract)', () => {
  test('childPath appends the child index', () => {
    expect(childPath('0', 0)).toBe('0.0')
    expect(childPath('0.1', 2)).toBe('0.1.2')
  })

  test('repeatPath uses no suffix for the first item and (n) after', () => {
    expect(repeatPath('0', undefined)).toBe('0')
    expect(repeatPath('0', 0)).toBe('0')
    expect(repeatPath('0', 1)).toBe('0(1)')
    expect(repeatPath('0', 2)).toBe('0(2)')
    expect(repeatPath('0.1', 3)).toBe('0.1(3)')
  })

  test('repeat item children compose with childPath', () => {
    // Second repeat item's first child: "0(1).0"
    expect(childPath(repeatPath('0', 1), 0)).toBe('0(1).0')
  })

  test('parseRepeatSuffix round-trips repeatPath', () => {
    expect(parseRepeatSuffix('0')).toEqual({
      base: '0',
      repeatIndex: undefined,
    })
    expect(parseRepeatSuffix('0(2)')).toEqual({
      base: '0',
      repeatIndex: 2,
    })
    expect(parseRepeatSuffix('0(1).0')).toEqual({
      base: '0(1).0',
      repeatIndex: undefined,
    })
  })

  test('buildSlotSuffix matches the SSR/runtime convention', () => {
    expect(buildSlotSuffix(undefined, 0, undefined)).toBe('')
    // Second slot with the same name
    expect(buildSlotSuffix(undefined, 1, undefined)).toBe('{1}')
    // Repeated content projected into a slot
    expect(buildSlotSuffix(undefined, 0, 2)).toBe('(2)')
    // Both, stacked on a forwarded suffix
    expect(buildSlotSuffix('(1)', 1, 2)).toBe('(1){1}(2)')
    // Does not duplicate identical suffixes already present
    expect(buildSlotSuffix('(1)', 0, 1)).toBe('(1)')
    expect(buildSlotSuffix('{1}', 1, undefined)).toBe('{1}')
  })

  test('applySlotSuffix is idempotent', () => {
    expect(applySlotSuffix('0.0[default]', '{1}')).toBe('0.0[default]{1}')
    expect(applySlotSuffix('0.0[default]{1}', '{1}')).toBe('0.0[default]{1}')
    expect(applySlotSuffix('0.0[default]', '')).toBe('0.0[default]')
    expect(applySlotSuffix('0.0[default]', undefined)).toBe('0.0[default]')
  })

  test('slotBasePath uses the [slotName] convention', () => {
    expect(slotBasePath('0', 0, 'default')).toBe('0.0[default]')
    expect(slotBasePath('0', 1, 'header')).toBe('0.1[header]')
  })
})
