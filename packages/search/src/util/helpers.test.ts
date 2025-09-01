import { describe, expect, test } from 'bun:test'
import { shouldSearchExactPath, shouldVisitTree } from './helpers'

describe('shouldSearchPath', () => {
  test('should return true for paths in pathsToVisit', () => {
    const pathsToVisit = [
      ['components', 'Button'],
      ['components', 'Input'],
    ]
    expect(
      shouldVisitTree({
        path: ['components', 'Button', 'attrs', 'attr1', 'testValue'],
        pathsToVisit,
      }),
    ).toBe(true)
    expect(
      shouldVisitTree({ path: ['components', 'Input'], pathsToVisit }),
    ).toBe(true)
    expect(
      shouldVisitTree({
        path: ['components', 'Button', 'formulas'],
        pathsToVisit,
      }),
    ).toBe(true)
    expect(
      shouldVisitTree({
        path: ['components', 'project-sidebar-item'],
        pathsToVisit: [
          [
            'components',
            'project-sidebar-item',
            'formulas',
            'p_Z1PzOcDop79KGafQ7Lm',
            'formula',
          ],
        ],
      }),
    ).toBe(true)
  })

  test('should return false for paths not in pathsToVisit', () => {
    const pathsToVisit = [
      ['components', 'Button'],
      ['components', 'Input'],
    ]
    expect(
      shouldVisitTree({ path: ['components', 'Card'], pathsToVisit }),
    ).toBe(false)
    expect(
      shouldVisitTree({ path: ['components', 'Form'], pathsToVisit }),
    ).toBe(false)
  })
})

describe('shouldSearchExactPath', () => {
  test.only('should only return true for exact matches', () => {
    const pathsToVisit = [
      ['components', 'Button'],
      ['components', 'Input'],
    ]
    expect(
      shouldSearchExactPath({ path: ['components', 'Button'], pathsToVisit }),
    ).toBe(true)
    expect(
      shouldSearchExactPath({ path: ['components', 'Input'], pathsToVisit }),
    ).toBe(true)
    expect(
      shouldSearchExactPath({
        path: ['components', 'Button', 'formulas'],
        pathsToVisit,
      }),
    ).toBe(false)
    expect(
      shouldSearchExactPath({
        path: ['components', 'project-sidebar-item'],
        pathsToVisit,
      }),
    ).toBe(false)
  })
})
