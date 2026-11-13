import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import {
  createElementSearchRule,
  parseCssQuery,
  shouldRun,
} from './elementSearchRule'

describe('parseCssQuery Predicate & Parser', () => {
  test('should detect valid queries', () => {
    expect(shouldRun('node:div.my-class')).toBe(true)
    expect(shouldRun('node:.fill[path="my-path"]')).toBe(true)
    expect(shouldRun('node:[disabled]')).toBe(true)
    expect(shouldRun('node:button[type="submit"]')).toBe(true)
    expect(shouldRun('node:svg.icon.small[width="32"]')).toBe(true)
  })

  test('should ignore non-css queries', () => {
    expect(shouldRun('div.my-class')).toBe(false)
    expect(shouldRun('.fill[path="my-path"]')).toBe(false)
    expect(shouldRun('component:my-comp')).toBe(false)
    expect(shouldRun('ref:component:my-comp')).toBe(false)
    expect(shouldRun('workflow:save')).toBe(false)
    expect(shouldRun('formula:foo')).toBe(false)
    expect(shouldRun('/regex/')).toBe(false)
  })

  test('should parse correctly', () => {
    expect(parseCssQuery('node:div.my-class')).toEqual({
      tag: 'div',
      classes: ['my-class'],
      attrs: [],
    })

    expect(parseCssQuery('div.my-class')).toEqual({
      tag: 'div',
      classes: ['my-class'],
      attrs: [],
    })

    expect(parseCssQuery('node:.fill[path="my-path"]')).toEqual({
      tag: undefined,
      classes: ['fill'],
      attrs: [{ name: 'path', value: 'my-path' }],
    })

    expect(parseCssQuery('[disabled]')).toEqual({
      tag: undefined,
      classes: [],
      attrs: [{ name: 'disabled', value: undefined }],
    })

    expect(parseCssQuery('node:svg.icon.small[width="32"]')).toEqual({
      tag: 'svg',
      classes: ['icon', 'small'],
      attrs: [{ name: 'width', value: '32' }],
    })
  })
})

describe('Element Search Rule', () => {
  const files: ProjectFiles = {
    formulas: {},
    components: {
      'test-component': {
        name: 'test-component',
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
            classes: {
              container: { formula: { type: 'value', value: true } },
              active: {
                formula: { type: 'apply', name: 'isActive', arguments: [] },
              },
            },
            attrs: {
              id: { type: 'value', value: 'main-container' },
            },
            children: ['btn'],
          },
          btn: {
            type: 'element',
            tag: 'button',
            classes: {
              btn: { formula: { type: 'value', value: true } },
              'btn-primary': { formula: { type: 'value', value: true } },
            },
            attrs: {
              type: { type: 'value', value: 'submit' },
              disabled: { type: 'value', value: true },
            },
            children: [],
          },
          sub: {
            type: 'component',
            name: 'other-comp',
            children: [],
          },
        },
        formulas: {},
        apis: {},
        attributes: {},
        variables: {},
        route: { path: [], query: {} },
        workflows: {},
      },
    },
  }

  test('find elements by tag only', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [createElementSearchRule({ query: 'node:button' })],
      }),
    )
    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual([
      'components',
      'test-component',
      'nodes',
      'btn',
    ])
    expect(results[0].details?.context).toEqual({
      before: 'div > ',
      matched: 'button.btn.btn-primary',
      after: '',
    })
  })

  test('find elements by class (including conditional ones)', () => {
    // Finds active class even if it is dynamic/conditional
    const results = Array.from(
      searchProject({
        files,
        rules: [createElementSearchRule({ query: 'node:.active' })],
      }),
    )
    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual([
      'components',
      'test-component',
      'nodes',
      'root',
    ])
  })

  test('find elements with nested classes', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [
          createElementSearchRule({ query: 'node:button.btn.btn-primary' }),
        ],
      }),
    )
    expect(results).toHaveLength(1)
  })

  test('find elements by attribute existence', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [createElementSearchRule({ query: 'node:[disabled]' })],
      }),
    )
    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual([
      'components',
      'test-component',
      'nodes',
      'btn',
    ])
  })

  test('find elements by attribute value', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [
          createElementSearchRule({ query: 'node:div[id="main-container"]' }),
        ],
      }),
    )
    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual([
      'components',
      'test-component',
      'nodes',
      'root',
    ])
  })

  test('find elements with wildcards in attributes/classes', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [createElementSearchRule({ query: 'node:button.btn-*' })],
      }),
    )
    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual([
      'components',
      'test-component',
      'nodes',
      'btn',
    ])
  })
})
