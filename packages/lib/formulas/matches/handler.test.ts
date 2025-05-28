import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Matches', () => {
  test('returns an empty array if the inputs are not valid', () => {
    expect(handler([1, '\\d.*'], undefined as any)).toEqual([])
    expect(handler(['hello world', 4], undefined as any)).toEqual([])
  })

  test('match numbers', () => {
    expect(handler(['100px', '\\d+', true], undefined as any)).toEqual(['100'])
  })

  test('returns matches based on the regex as expected', () => {
    expect(
      handler(
        ['my test string', '(test)', true, false, false],
        undefined as any,
      ),
    ).toEqual(['test'])
    expect(
      handler(
        ['my test string', '(TEST)', true, true, false],
        undefined as any,
      ),
    ).toEqual(['test'])
    expect(
      handler(
        [
          'Test string with an email@test.com and other text plus another email@mail.dev',
          // String.raw is needed to avoid escaping the backslashes
          String.raw`(?<=[ ;|,:]|^)([A-Z\.\-a-z1-9]+@[A-Za-z1-9]+?\.[A-Za-z1-9\.]+?)(?=[ ;|,:]|$)`,
          true,
          false,
          true,
        ],
        undefined as any,
      ),
    ).toEqual(['email@test.com', 'email@mail.dev'])
  })
})
