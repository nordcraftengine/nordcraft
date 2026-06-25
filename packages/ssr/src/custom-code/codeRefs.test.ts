import type { Component } from '@nordcraft/core/dist/component/component.types'
import { describe, expect, test } from 'bun:test'
import type { ProjectFiles } from '../ssr.types'
import { hasCustomCode } from './codeRefs'

describe('hasCustomCode', () => {
  const baseFiles: ProjectFiles = {
    components: {},
    formulas: {},
    actions: {},
  }

  const baseComponent: Component = {
    name: 'test',
    nodes: {},
    apis: {},
    variables: {},
    workflows: {},
  }

  test('returns false for component with no custom code', () => {
    expect(hasCustomCode(baseComponent, baseFiles)).toBe(false)
  })

  test('returns true for component with custom action', () => {
    const component: Component = {
      ...baseComponent,
      workflows: {
        w1: {
          name: 'w1',
          parameters: [],
          actions: [
            {
              type: 'Custom',
              name: 'myAction',
              arguments: [],
            },
          ],
        },
      },
    }
    expect(hasCustomCode(component, baseFiles)).toBe(true)
  })

  test('returns true for component with function formula', () => {
    const component: Component = {
      ...baseComponent,
      variables: {
        v1: {
          initialValue: {
            type: 'function',
            name: 'myFormula',
            arguments: [],
          },
        },
      },
    }
    expect(hasCustomCode(component, baseFiles)).toBe(true)
  })

  test('returns false for component with non-function formula', () => {
    const component: Component = {
      ...baseComponent,
      variables: {
        v1: {
          initialValue: {
            type: 'value',
            value: 'myValue',
          },
        },
      },
    }
    expect(hasCustomCode(component, baseFiles)).toBe(false)
  })

  test('returns true if a child component has custom action', () => {
    const childComponent: Component = {
      ...baseComponent,
      name: 'child',
      workflows: {
        w1: {
          name: 'w1',
          parameters: [],
          actions: [
            {
              type: 'Custom',
              name: 'myAction',
              arguments: [],
            },
          ],
        },
      },
    }
    const component: Component = {
      ...baseComponent,
      nodes: {
        n1: {
          type: 'component',
          name: 'child',
          attrs: {},
          events: {},
        },
      },
    }
    const files: ProjectFiles = {
      ...baseFiles,
      components: {
        child: childComponent,
      },
    }
    expect(hasCustomCode(component, files)).toBe(true)
  })

  test('returns true if a child component has a custom formula', () => {
    const childComponent: Component = {
      ...baseComponent,
      name: 'child',
      variables: {
        v1: {
          initialValue: {
            type: 'function',
            name: 'myFormula',
            arguments: [],
          },
        },
      },
    }
    const component: Component = {
      ...baseComponent,
      nodes: {
        n1: {
          type: 'component',
          name: 'child',
          attrs: {},
          events: {},
        },
      },
    }
    const files: ProjectFiles = {
      ...baseFiles,
      components: {
        child: childComponent,
      },
    }
    expect(hasCustomCode(component, files)).toBe(true)
  })
})
