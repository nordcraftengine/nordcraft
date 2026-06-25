import type { Component } from '@nordcraft/core/dist/component/component.types'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { describe, expect, test } from 'bun:test'
import type { ProjectFiles } from '../ssr.types'
import { getActionReferences, hasCustomCode } from './codeRefs'

describe('getActionReferences', () => {
  test('it return custom actions used in the component', () => {
    const demo = new ToddleComponent({
      component: {
        name: 'demo',
        apis: {},
        attributes: {},
        nodes: {},
        variables: {},
        workflows: {
          '7XLoA3': {
            name: 'my-workflow',
            actions: [
              {
                type: 'Custom',
                name: 'MyCustomAction',
              },
              {
                name: 'MyLegacyCustomAction',
              },
            ],
            parameters: [],
          },
        },
      },
      getComponent: () => undefined,
      packageName: 'demo',
      globalFormulas: { formulas: {}, packages: {} },
    })
    const actions = Array.from(getActionReferences(demo))
    expect(actions).toEqual(['MyCustomAction', 'MyLegacyCustomAction'])
  })
  test('it return custom actions referenced in workflow callbacks', () => {
    const demo = new ToddleComponent({
      component: {
        name: 'demo',
        apis: {},
        attributes: {},
        nodes: {},
        variables: {},
        onLoad: {
          trigger: 'onLoad',
          actions: [
            {
              type: 'TriggerWorkflow',
              callbacks: {
                'test event': {
                  actions: [
                    {
                      type: 'Custom',
                      name: 'MyCustomAction',
                    },
                  ],
                },
              },
              workflow: 'AsqRCv',
              parameters: {},
            },
          ],
        },
      },
      getComponent: () => undefined,
      packageName: 'demo',
      globalFormulas: { formulas: {}, packages: {} },
    })
    const actions = Array.from(getActionReferences(demo))
    expect(actions).toEqual(['MyCustomAction'])
  })
  test('it should not include non-custom actions', () => {
    const demo = new ToddleComponent({
      component: {
        name: 'demo',
        apis: {},
        attributes: {},
        nodes: {},
        variables: {},
        workflows: {
          '7XLoA3': {
            name: 'my-workflow',
            actions: [
              {
                type: 'SetVariable',
                data: {
                  type: 'value',
                  value: 'Hello World',
                },
                variable: 'my-variable',
              },
              {
                type: 'TriggerEvent',
                event: 'my-event',
                data: {
                  type: 'value',
                  value: 'Hello World',
                },
              },
            ],
            parameters: [],
          },
        },
      },
      getComponent: () => undefined,
      packageName: 'demo',
      globalFormulas: { formulas: {}, packages: {} },
    })
    const actions = Array.from(getActionReferences(demo))
    expect(actions).toEqual([])
  })
})

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

  test('returns false for component with builtin action reference', () => {
    const component: Component = {
      ...baseComponent,
      workflows: {
        w1: {
          name: 'w1',
          parameters: [],
          actions: [
            {
              name: '@toddle/gotToURL',
              arguments: [
                {
                  name: 'URL',
                  formula: { type: 'value', value: 'https://example.com' },
                },
              ],
              label: 'Go to URL',
            },
          ],
        },
      },
    }
    expect(hasCustomCode(component, baseFiles)).toBe(false)
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
