import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: formatDate', () => {
  test('Should format dates correctly', () => {
    const now = new Date()
    expect(
      handler(
        [now, undefined, { dateStyle: 'short' } as Intl.DateTimeFormatOptions],
        undefined as any,
      ),
    ).toEqual(
      `${now.getMonth() + 1}/${now.getDate()}/${String(
        now.getFullYear(),
      ).substring(2)}`, // something like 6/27/23
    )
    expect(handler([now, 'fr'], undefined as any)).toEqual(
      `${`${now.getDate()}`.padStart(2, '0')}/${`${
        now.getMonth() + 1
      }`.padStart(2, '0')}/${now.getFullYear()}`, // something like 27/06/23
    )
    expect(
      handler(
        [
          now,
          undefined,
          { weekday: 'long', year: 'numeric' } as Intl.DateTimeFormatOptions,
        ],
        undefined as any,
      ),
    ).toEqual(
      `${now.getFullYear()} ${
        [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ][now.getDay()]
      }`,
    )
  })
})
