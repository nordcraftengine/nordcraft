import type { Component } from '@nordcraft/core/dist/component/component.types'
import { beforeEach, describe, expect, test } from 'bun:test'
import {
  createStaticContextFromComponent,
  getComponentMap,
  resetComponentMapCache,
} from './context'

describe('context component lookup', () => {
  beforeEach(() => {
    resetComponentMapCache()
  })

  test('getComponentMap caches lookup and updates when new components come in', () => {
    const compA: Component = {
      name: 'CompA',
      nodes: { root: { type: 'element', tag: 'div', children: [] } },
    }
    const compB: Component = {
      name: 'CompB',
      nodes: { root: { type: 'element', tag: 'div', children: [] } },
    }

    const map1 = getComponentMap([compA])
    expect(map1.get('CompA')).toBe(compA)
    expect(map1.get('CompB')).toBeUndefined()

    // Same components in a new array reference should reuse cached map
    const map2 = getComponentMap([compA])
    expect(map2).toBe(map1)

    // When new components come in, the map should update
    const map3 = getComponentMap([compA, compB])
    expect(map3).not.toBe(map1)
    expect(map3.get('CompA')).toBe(compA)
    expect(map3.get('CompB')).toBe(compB)
  })

  test('createStaticContextFromComponent handles context providers using the map', () => {
    const provider: Component = {
      name: 'ThemeContext',
      attributes: {
        theme: {
          name: 'theme',
          testValue: 'dark',
        },
      },
      nodes: { root: { type: 'element', tag: 'div', children: [] } },
    }
    const consumer: Component = {
      name: 'Consumer',
      contexts: {
        ThemeContext: {
          formulas: [],
          workflows: [],
        },
      },
      nodes: { root: { type: 'element', tag: 'div', children: [] } },
    }

    const env = {
      isServer: false as const,
      branchName: 'main',
      request: undefined,
      runtime: 'preview' as const,
      logErrors: false,
    }

    const result = createStaticContextFromComponent(
      consumer,
      [provider, consumer],
      {
        env,
      },
    )

    expect(result).toHaveProperty('ThemeContext')
  })
})
