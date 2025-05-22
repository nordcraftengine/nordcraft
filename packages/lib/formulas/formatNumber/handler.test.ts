import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: formatNumber', () => {
  test('Should format numbers correctly', () => {
    expect(
      handler(
        [
          4.5,
          ['en-US'],
          { style: 'unit', unit: 'liter' } as Intl.DateTimeFormatOptions,
        ],
        undefined as any,
      ),
    ).toEqual(`4.5 L`)
    // Add a test for currency formatting
    expect(
      handler(
        [
          4.5,
          ['en-US'],
          { style: 'currency', currency: 'USD' } as Intl.DateTimeFormatOptions,
        ],
        undefined as any,
      ),
    ).toEqual(`$4.50`)
    // test minimumIntegerDigits
    expect(
      handler(
        [
          4.5,
          ['en-US'],
          { minimumIntegerDigits: 3 } as Intl.DateTimeFormatOptions,
        ],
        undefined as any,
      ),
    ).toEqual(`004.5`)
    // test useGrouping
    expect(
      handler(
        [4500, ['en-US'], { useGrouping: false } as Intl.DateTimeFormatOptions],
        undefined as any,
      ),
    ).toEqual(`4500`)
    expect(
      handler(
        [4500, ['en-US'], { useGrouping: true } as Intl.DateTimeFormatOptions],
        undefined as any,
      ),
    ).toEqual(`4,500`)
  })
})
