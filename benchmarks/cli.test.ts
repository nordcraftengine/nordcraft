import { describe, expect, test } from 'bun:test'
import {
  getBoolean,
  getNonNegativeNumber,
  getNumber,
  getOptionalString,
  getPositiveInteger,
  parseBenchmarkArgs,
} from './cli'

describe('benchmark CLI helpers', () => {
  test('parses flags, values, and values containing equals signs', () => {
    const args = parseBenchmarkArgs([
      '--runs=12',
      '--base-ref=refs/heads/feature=one',
      '--json',
    ])

    expect(args.get('--runs')).toBe('12')
    expect(args.get('--base-ref')).toBe('refs/heads/feature=one')
    expect(getBoolean(args, '--json', false)).toBe(true)
  })

  test('supports optional strings and numeric validation', () => {
    const args = parseBenchmarkArgs(['--output='])
    expect(getOptionalString(args, '--output')).toBeUndefined()
    expect(getOptionalString(args, '--missing')).toBeUndefined()
    expect(getNumber(args, '--missing', 3)).toBe(3)
    expect(getNonNegativeNumber(args, '--missing', 0)).toBe(0)
    const invalidArgs = parseBenchmarkArgs(['--number=invalid'])
    expect(() => getNumber(invalidArgs, '--number', 0)).toThrow()
    const emptyArgs = parseBenchmarkArgs(['--number='])
    expect(() => getNumber(emptyArgs, '--number', 0)).toThrow()
    const invalidIntegerArgs = parseBenchmarkArgs(['--count=0'])
    expect(() => getPositiveInteger(invalidIntegerArgs, '--count', 1)).toThrow()
    const invalidBooleanArgs = parseBenchmarkArgs(['--enabled=maybe'])
    expect(() => getBoolean(invalidBooleanArgs, '--enabled', false)).toThrow()
  })
})
