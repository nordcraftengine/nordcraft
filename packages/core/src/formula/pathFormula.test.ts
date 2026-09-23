import { describe, expect, it } from 'bun:test'
import type { PathOperation } from './formula'
import { applyPathFormula } from './pathFormula'

describe('applyPathFormula', () => {
  it('returns the value at the given path', () => {
    const formula: PathOperation = { type: 'path', path: ['foo', 'bar'] }
    const data: any = { foo: { bar: 42 } }
    expect(applyPathFormula(formula, data)).toBe(42)
  })

  it('returns undefined if the path does not exist', () => {
    const formula: PathOperation = { type: 'path', path: ['foo', 'baz'] }
    const data: any = { foo: { bar: 42 } }
    expect(applyPathFormula(formula, data)).toBeUndefined()
  })

  it('returns null if intermediate value is not an object', () => {
    const formula: PathOperation = { type: 'path', path: ['foo', 'bar', 'baz'] }
    const data: any = { foo: { bar: 42 } }
    expect(applyPathFormula(formula, data)).toBeNull()
  })

  it('returns the root value if path is empty', () => {
    const formula: PathOperation = { type: 'path', path: [] }
    const data: any = { foo: 1 }
    expect(applyPathFormula(formula, data)).toEqual(data)
  })

  it('works with numeric keys', () => {
    const formula: PathOperation = { type: 'path', path: ['arr', 1] }
    const data: any = { arr: [10, 20, 30] }
    expect(applyPathFormula(formula, data)).toBe(20)
  })
})
