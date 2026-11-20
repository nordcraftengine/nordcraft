import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Sort by', () => {
  test('should sort numbers with ID function', () => {
    expect(
      handler([[1, 3, 2], (a: any) => a.item, true], undefined as any),
    ).toEqual([1, 2, 3])
  })
  test('should sort strings with ID function', () => {
    expect(
      handler(
        [['hello', 'world', 'there'], (a: any) => a.item, true],
        undefined as any,
      ),
    ).toEqual(['hello', 'there', 'world'])
  })
  test('should respect ascending', () => {
    expect(
      handler([[1, 3, 2], (a: any) => a.item, false], undefined as any),
    ).toEqual([3, 2, 1])
  })
  test('should sort list of objects by property', () => {
    expect(
      handler(
        [
          [
            { name: 'Andreas' },
            { name: 'Jacob' },
            { name: 'Kasper' },
            { name: 'Erik' },
          ],
          (a: any) => a.item.name,
          true,
        ],
        undefined as any,
      ),
    ).toEqual([
      { name: 'Andreas' },
      { name: 'Erik' },
      { name: 'Jacob' },
      { name: 'Kasper' },
    ])
  })
  test('should sort by priority when formula returns an array', () => {
    expect(
      handler(
        [
          [
            { name: 'Andreas', role: 'Engineer' },
            { name: 'Vakis', role: 'Marketing' },
            { name: 'Kasper', role: 'Designer' },
            { name: 'Erik', role: 'Engineer' },
          ],
          (a: any) => [a.item.role, a.item.name],
          true,
        ],
        undefined as any,
      ),
    ).toEqual([
      { name: 'Kasper', role: 'Designer' },
      { name: 'Andreas', role: 'Engineer' },
      { name: 'Erik', role: 'Engineer' },
      { name: 'Vakis', role: 'Marketing' },
    ])
  })
  test('should return a shallow copy without evaluating formula on empty or single-element arrays', () => {
    let calls = 0
    const singleInput = [{ id: 1 }]
    const emptyInput: unknown[] = []
    const keyFn = (args: { item: unknown }) => {
      calls++
      return args.item
    }
    const ctx = {
      component: { name: 'Test', nodes: {} },
      data: {},
      root: undefined as never,
      env: {
        isServer: false as const,
        branchName: 'main',
        request: undefined,
        runtime: 'page' as const,
        logErrors: false,
      },
    }
    const singleResult = handler([singleInput, keyFn, true], ctx)
    const emptyResult = handler([emptyInput, keyFn, true], ctx)
    expect({
      singleResult,
      emptyResult,
      singleIsCopy: singleResult !== singleInput,
      emptyIsCopy: emptyResult !== emptyInput,
      calls,
    }).toEqual({
      singleResult: [{ id: 1 }],
      emptyResult: [],
      singleIsCopy: true,
      emptyIsCopy: true,
      calls: 0,
    })
  })
})
