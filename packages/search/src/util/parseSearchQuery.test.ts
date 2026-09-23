import { describe, expect, test } from 'bun:test'
import { parseSearchQuery } from './parseSearchQuery'

describe('parseSearchQuery', () => {
  test('it should parse simple strings as a literal', () => {
    const result = parseSearchQuery('Some string')
    expect(result).toHaveLength(1)
    expect(result[0].fields).toBe('Some string')
  })

  test('it should parse case-insensitive regex', () => {
    const result = parseSearchQuery('/some string/i')
    expect(result).toHaveLength(1)
    expect(result[0].fields).toBeInstanceOf(RegExp)
    expect((result[0].fields as RegExp).source).toBe('some string')
    expect((result[0].fields as RegExp).flags).toBe('i')
  })

  test('it should parse case-sensitive regex', () => {
    const result = parseSearchQuery('/Some string/')
    expect(result).toHaveLength(1)
    expect(result[0].fields).toBeInstanceOf(RegExp)
    expect((result[0].fields as RegExp).source).toBe('Some string')
    expect((result[0].fields as RegExp).flags).toBe('')
  })

  test('it should parse Variable,my-var as a literal', () => {
    const result = parseSearchQuery('Variable,my-var')
    expect(result).toHaveLength(1)
    expect(result[0].fields).toBe('Variable,my-var')
  })

  test('it should parse programmatic search with empty nodeType and exact match quotes', () => {
    const result = parseSearchQuery('<>tag:"div"')
    expect(result).toHaveLength(1)
    expect(result[0].nodeType).toBeUndefined()
    expect(result[0].fields).toEqual({ tag: '"div"' })
  })

  test('it should parse programmatic search with specific nodeType and exact match quotes', () => {
    const result = parseSearchQuery('<component-node>tag:"img"')
    expect(result).toHaveLength(1)
    expect(result[0].nodeType).toBe('component-node')
    expect(result[0].fields).toEqual({ tag: '"img"' })
  })

  test('it should parse programmatic search with multiple fields and regex', () => {
    const result = parseSearchQuery('<>tag:"img" attrs.alt:"/.+/"')
    expect(result).toHaveLength(1)
    expect(result[0].fields).toEqual({
      tag: '"img"',
      'attrs.alt': expect.any(RegExp),
    })
    expect((result[0].fields as any)['attrs.alt'].source).toBe('.+')
  })
})
