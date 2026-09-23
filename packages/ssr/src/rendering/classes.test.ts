import type { Component } from '@nordcraft/core/dist/component/component.types'
import {
  pathFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { resolveClasses } from './classes'

describe('resolveClasses', () => {
  test('should convert static styles to classes and strip style property', () => {
    const component: Component = {
      name: 'Test',
      nodes: {
        root: {
          id: 'root',
          type: 'element',
          tag: 'div',
          style: { color: 'red' },
          children: [],
        },
      },
    }

    const resolved = resolveClasses()(component)
    const node = resolved.nodes?.root as any

    expect(node.style).toBeUndefined()
    expect(node.classes).toBeDefined()
    // The hash depends on the implementation of getClassName,
    // but we expect at least one class with a true formula.
    const classHashes = Object.keys(node.classes)
    expect(classHashes.length).toBe(1)
    expect(node.classes[classHashes[0]!]).toEqual({
      formula: valueFormula(true),
    })
  })

  test('should keep dynamic custom properties in variants and strip static ones', () => {
    const component: Component = {
      name: 'Test',
      nodes: {
        root: {
          id: 'root',
          type: 'element',
          tag: 'div',
          variants: [
            {
              hover: true,
              style: { color: 'blue' },
              customProperties: {
                '--static': { formula: valueFormula('10px') },
                '--dynamic': { formula: pathFormula(['variables', 'width']) },
              },
            },
          ],
          children: [],
        },
      },
    }

    const resolved = resolveClasses()(component)
    const node = resolved.nodes?.root as any

    expect(node.variants).toBeDefined()
    expect(node.variants.length).toBe(1)

    const variant = node.variants[0]
    expect(variant.style).toEqual(undefined)
    expect(variant.customProperties).toEqual({
      '--dynamic': { formula: pathFormula(['variables', 'width']) },
    })
    // Static property should be filtered out
    expect(variant.customProperties['--static']).toBeUndefined()
  })

  test('should remove variants if they have no dynamic custom properties after filtering', () => {
    const component: Component = {
      name: 'Test',
      nodes: {
        root: {
          id: 'root',
          type: 'element',
          tag: 'div',
          variants: [
            {
              hover: true,
              style: { color: 'blue' },
              customProperties: {
                '--static': { formula: valueFormula('10px') },
              },
            },
          ],
          children: [],
        },
      },
    }

    const resolved = resolveClasses()(component)
    const node = resolved.nodes?.root as any

    expect(node.variants).toBeUndefined()
  })

  test('should keep dynamic custom properties on the node itself', () => {
    const component: Component = {
      name: 'Test',
      nodes: {
        root: {
          id: 'root',
          type: 'element',
          tag: 'div',
          customProperties: {
            '--node-static': { formula: valueFormula('red') },
            '--node-dynamic': { formula: pathFormula(['variables', 'bg']) },
          },
          children: [],
        },
      },
    }

    const resolved = resolveClasses()(component)
    const node = resolved.nodes?.root as any

    expect(node.customProperties).toEqual({
      '--node-dynamic': { formula: pathFormula(['variables', 'bg']) },
    })
    expect(node.customProperties['--node-static']).toBeUndefined()
  })

  test('should skip non-element nodes', () => {
    const component: Component = {
      name: 'Test',
      nodes: {
        root: {
          type: 'text',
          value: valueFormula('Hello'),
        },
      },
    }

    const resolved = resolveClasses()(component)
    expect(resolved.nodes?.root).toEqual(component.nodes?.root)
  })

  test('should handle component nodes', () => {
    const component: Component = {
      name: 'Test',
      nodes: {
        root: {
          id: 'root',
          type: 'component',
          name: 'MyComponent',
          style: { color: 'red' },
          children: [],
        },
      },
    }

    const resolved = resolveClasses()(component)
    const node = resolved.nodes?.root as any

    expect(node.style).toBeUndefined()
  })

  test('should move static custom properties to the node style itself', () => {
    const component: Component = {
      name: 'Test',
      nodes: {
        root: {
          id: 'root',
          type: 'element',
          tag: 'div',
          customProperties: {
            '--static': { formula: valueFormula('red') },
          },
          children: [],
        },
      },
    }

    const resolved = resolveClasses({ clearStyle: false })(component)
    const node = resolved.nodes?.root as any

    expect(node.style).toEqual({ '--static': 'red' })
  })
})
