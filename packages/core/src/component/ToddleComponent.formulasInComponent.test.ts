import { functionFormula, valueFormula } from '../formula/formulaUtils'
import { ToddleComponent } from './ToddleComponent'
import type { Component } from './component.types'

describe('ToddleComponent.formulasInComponent', () => {
  test('it return formulas used in parameters of TriggerWorkflow actions', () => {
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
                type: 'TriggerWorkflow',
                workflow: 'jm3yUN',
                parameters: {
                  'param-1': {
                    formula: {
                      name: 'scrollPosition',
                      type: 'function',
                      arguments: [],
                    },
                  },
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
    const formulas = Array.from(demo.formulasInComponent()).map(
      ({ formula }) => formula,
    )
    expect(formulas).toContainEqual({
      name: 'scrollPosition',
      type: 'function',
      arguments: [],
    })
  })
  test('it returns formulas used in APIs', () => {
    const demo = new ToddleComponent({
      component: {
        name: 'demo',
        apis: {
          legacyApi: {
            name: 'legacyAPI',
            type: 'REST',
            url: valueFormula('https://api.example.com'),
            autoFetch: {
              type: 'function',
              name: 'customFunction',
              arguments: [],
            },
            onCompleted: null,
            onFailed: null,
          },
          v2Api: {
            name: 'v2API',
            type: 'http',
            version: 2,
            url: valueFormula('https://api.example.com'),
            autoFetch: {
              type: 'function',
              name: 'otherFunction',
              arguments: [],
            },
            client: {
              parserMode: 'auto',
              onCompleted: null,
              onFailed: null,
            },
            inputs: {},
          },
        },
        attributes: {},
        nodes: {},
        variables: {},
        workflows: {},
      },
      getComponent: () => undefined,
      packageName: undefined,
      globalFormulas: { formulas: {}, packages: {} },
    })
    const formulas = Array.from(demo.formulasInComponent()).map(
      ({ formula }) => formula,
    )
    expect(formulas).toContainEqual({
      name: 'customFunction',
      type: 'function',
      arguments: [],
    })
    expect(formulas).toContainEqual({
      name: 'otherFunction',
      type: 'function',
      arguments: [],
    })
  })
  test('it returns global formulas', () => {
    const demo = new ToddleComponent({
      component: {
        name: 'demo',
        apis: {},
        attributes: {},
        nodes: {},
        variables: {
          x: {
            initialValue: functionFormula('globalFunction'),
          },
        },
        workflows: {},
      },
      getComponent: () => undefined,
      packageName: undefined,
      globalFormulas: {
        formulas: {
          globalFunction: {
            name: 'globalFunction',
            arguments: [],
            formula: valueFormula(4),
          },
        },
        packages: {},
      },
    })
    const formulas = Array.from(demo.formulasInComponent()).map(
      ({ formula }) => formula,
    )
    expect(formulas).toContainEqual({
      name: 'globalFunction',
      type: 'function',
      arguments: [],
    })
  })
  test('it returns global formulas that are referenced through global formulas', () => {
    const demo = new ToddleComponent({
      component: {
        name: 'demo',
        apis: {},
        attributes: {},
        nodes: {},
        variables: {
          x: {
            initialValue: functionFormula('globalFunction'),
          },
        },
        workflows: {},
      },
      getComponent: () => undefined,
      packageName: undefined,
      globalFormulas: {
        formulas: {
          globalFunction: {
            name: 'globalFunction',
            arguments: [],
            formula: functionFormula('otherGlobalFunction'),
          },
          otherGlobalFunction: {
            name: 'otherGlobalFunction',
            arguments: [],
            formula: valueFormula(4),
          },
        },
        packages: {},
      },
    })
    const formulas = Array.from(demo.formulasInComponent()).map(
      ({ formula }) => formula,
    )
    expect(formulas).toContainEqual({
      name: 'globalFunction',
      type: 'function',
      arguments: [],
    })
    expect(formulas).toContainEqual({
      name: 'otherGlobalFunction',
      type: 'function',
      arguments: [],
    })
  })
  test("it stops following function refs after they've been visited once (no infinite loops)", () => {
    const demo = new ToddleComponent({
      component: {
        name: 'demo',
        apis: {},
        attributes: {},
        nodes: {},
        variables: {
          x: {
            initialValue: functionFormula('globalFunction'),
          },
        },
        workflows: {},
      },
      getComponent: () => undefined,
      packageName: undefined,
      globalFormulas: {
        formulas: {
          globalFunction: {
            name: 'globalFunction',
            arguments: [],
            formula: functionFormula('otherGlobalFunction'),
          },
          otherGlobalFunction: {
            name: 'otherGlobalFunction',
            arguments: [],
            formula: functionFormula('globalFunction'),
          },
        },
        packages: {},
      },
    })
    const formulas = Array.from(demo.formulasInComponent()).map(
      ({ formula }) => formula,
    )
    expect(formulas).toContainEqual({
      name: 'globalFunction',
      type: 'function',
      arguments: [],
    })
    expect(formulas).toContainEqual({
      name: 'otherGlobalFunction',
      type: 'function',
      arguments: [],
    })
  })

  test('it returns package formulas that use other formulas from the same package', () => {
    const demo = new ToddleComponent({
      component: {
        name: 'demo',
        apis: {},
        attributes: {},
        nodes: {
          node1: {
            type: 'component',
            name: 'MyComponent',
            package: 'my-pkg',
            tag: 'div',
            attrs: {
              attr1: functionFormula('outer', { package: 'my-pkg' }),
            },
            events: {},
            children: [],
          } as any,
        },
        variables: {},
        workflows: {},
      },
      getComponent: () => {
        return {
          name: 'MyComponent',
          apis: {},
          attributes: {
            attr1: { name: 'attr1', testValue: '' },
          },
          nodes: {},
          variables: {},
        } as Component
      },
      packageName: undefined,
      globalFormulas: {
        formulas: {},
        packages: {
          'my-pkg': {
            formulas: {
              outer: {
                name: 'outer',
                arguments: [],
                formula: functionFormula('inner'), // No package explicitly set
              },
              inner: {
                name: 'inner',
                arguments: [],
                formula: valueFormula('inner-val'),
              },
            },
          },
        },
      },
    })
    const formulas = Array.from(demo.formulasInComponent())

    expect(formulas.find((f) => f.formula.name === 'outer')).toBeDefined()
    expect(formulas.find((f) => f.formula.name === 'inner')).toBeDefined()
    expect(formulas.find((f) => f.formula.name === 'inner')?.packageName).toBe(
      'my-pkg',
    )
    expect(formulas).toEqual([
      {
        formula: {
          arguments: [],
          name: 'outer',
          package: 'my-pkg',
          type: 'function',
          variableArguments: undefined,
        },
        packageName: undefined,
        path: ['nodes', 'node1', 'attrs', 'attr1'],
      },
      {
        formula: {
          arguments: [],
          name: 'inner',
          package: undefined,
          type: 'function',
          variableArguments: undefined,
        },
        packageName: 'my-pkg',
        path: ['packages', 'my-pkg', 'formulas', 'outer'],
      },
      {
        formula: {
          type: 'value',
          value: 'inner-val',
        },
        packageName: 'my-pkg',
        path: ['packages', 'my-pkg', 'formulas', 'inner'],
      },
    ])
  })

  test('it should take both package formulas and project formulas when both exist with same name', () => {
    const demo = new ToddleComponent({
      component: {
        name: 'demo',
        apis: {},
        attributes: {},
        nodes: {
          node1: {
            type: 'element',
            tag: 'div',
            attrs: {
              attr1: functionFormula('my-formula'),
              attr2: functionFormula('my-formula', { package: 'my-pkg' }),
            },
            events: {},
            children: [],
          } as any,
        },
        variables: {},
        workflows: {},
      },
      getComponent: () => undefined,
      packageName: undefined,
      globalFormulas: {
        formulas: {
          'my-formula': {
            name: 'my-formula',
            arguments: [],
            formula: valueFormula('project-value'),
          },
        },
        packages: {
          'my-pkg': {
            formulas: {
              'my-formula': {
                name: 'my-formula',
                arguments: [],
                formula: valueFormula('package-value'),
              },
            },
          },
        },
      },
    })
    const formulas = Array.from(demo.formulasInComponent())

    expect(
      formulas.find(
        (f) =>
          f.formula.type === 'function' &&
          f.formula.name === 'my-formula' &&
          f.formula.package === undefined,
      ),
    ).toBeDefined()
    expect(
      formulas.find(
        (f) =>
          f.formula.type === 'function' &&
          f.formula.name === 'my-formula' &&
          f.formula.package === 'my-pkg',
      ),
    ).toBeDefined()

    expect(formulas).toContainEqual({
      formula: valueFormula('project-value'),
      packageName: undefined,
      path: ['formulas', 'my-formula'],
    })
    expect(formulas).toContainEqual({
      formula: valueFormula('package-value'),
      packageName: 'my-pkg',
      path: ['packages', 'my-pkg', 'formulas', 'my-formula'],
    })
  })
})
