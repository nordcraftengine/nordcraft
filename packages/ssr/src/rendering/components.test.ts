import type {
  Component,
  PageComponent,
} from '@nordcraft/core/dist/component/component.types'
import {
  functionFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import type { ProjectFiles } from '../ssr.types'
import { renderPageBody } from './components'
import { getPageFormulaContext } from './formulaContext'

describe('renderPageBody', () => {
  test('should render a simple page', async () => {
    const component: Component = {
      name: 'SimpleComponent',
      contexts: {},
      route: {
        path: [
          {
            name: 'home',
            type: 'static',
          },
        ],
        query: {},
      },
      events: [],
      nodes: {
        root: {
          tag: 'div',
          type: 'element',
          attrs: {
            'data-test-attr': {
              type: 'value',
              value: 'test',
            },
          },
          style: { color: 'red' },
          events: {},
          classes: {},
          children: [],
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
    }
    const { html } = await renderPageBody({
      evaluateComponentApis: () => ({}) as any,
      component: component as any,
      formulaContext: {
        data: {
          Attributes: {},
        },
        component,
        env: {} as any,
        package: undefined,
        toddle: {} as any,
      },
      env: {} as any,
      files: { components: { SimpleComponent: component } } as any,
      includedComponents: [component],
      projectId: 'test-project',
      req: {} as any,
    })
    expect(html).toBe(
      '<div data-test-attr="test" data-id="0" data-node-id="root" class="cTNpFk"></div>',
    )
  })

  test('should render a static value provided by a context provider component', async () => {
    const providerComponent: Component = {
      name: 'ProviderComponent',
      formulas: {
        contextValue: {
          name: 'contextValue',
          exposeInContext: true,
          formula: {
            type: 'value',
            value: 'provided-value',
          },
        },
      },
      nodes: {
        root: {
          type: 'component',
          name: 'ConsumerComponent',
          attrs: {},
          children: [],
          events: {},
          style: {},
        },
      },
    }
    const consumerComponent: Component = {
      name: 'ConsumerComponent',
      contexts: {
        ProviderComponent: {
          formulas: ['contextValue'],
          workflows: [],
        },
      },
      nodes: {
        root: {
          type: 'text',
          value: {
            type: 'path',
            path: ['Contexts', 'ProviderComponent', 'contextValue'],
          },
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
      events: [],
    }

    const { html } = await renderPageBody({
      evaluateComponentApis: () => ({}) as any,
      component: providerComponent as any,
      formulaContext: {
        data: {
          Attributes: {},
        },
        component: providerComponent,
        env: {} as any,
        package: undefined,
        toddle: {} as any,
      },
      env: {} as any,
      files: {
        components: {
          ProviderComponent: providerComponent,
          ConsumerComponent: consumerComponent,
        },
      } as any,
      includedComponents: [providerComponent, consumerComponent],
      projectId: 'test-project',
      req: {} as any,
    })

    expect(html).toBe(
      '<span data-node-type="text" data-node-id="root">provided-value</span>',
    )
  })

  // Bug: https://discord.com/channels/972416966683926538/1458386701612351612/1458386701612351612
  test('should render correct style overrides when component is used through packages', async () => {
    const buttonComponent: Component = {
      name: 'ButtonComponent',
      nodes: {
        root: {
          type: 'element',
          tag: 'button',
          attrs: {},
          style: {
            backgroundColor: 'blue',
          },
          events: {},
          classes: {},
          children: [],
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
      events: [],
    }

    const buttonWrapperComponent: Component = {
      name: 'ButtonWrapperComponent',
      nodes: {
        root: {
          type: 'component',
          name: 'ButtonComponent',
          attrs: {},
          children: [],
          events: {},
          style: {
            backgroundColor: 'red',
          },
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
      events: [],
    }

    const pageComponent: Component = {
      name: 'PageComponent',
      nodes: {
        root: {
          type: 'component',
          name: 'ButtonWrapperComponent',
          attrs: {},
          children: [],
          events: {},
          style: {},
          package: 'test-package',
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
      events: [],
    }

    const { html } = await renderPageBody({
      evaluateComponentApis: () => ({}) as any,
      component: pageComponent as any,
      formulaContext: {
        data: {
          Attributes: {},
        },
        component: pageComponent,
        env: {} as any,
        package: undefined,
        toddle: {} as any,
      },
      env: {} as any,
      files: {
        components: {
          PageComponent: pageComponent,
        },
        packages: {
          'test-package': {
            components: {
              ButtonWrapperComponent: buttonWrapperComponent,
              ButtonComponent: buttonComponent,
            },
          },
        },
      } as any,
      includedComponents: [
        pageComponent,
        buttonWrapperComponent,
        buttonComponent,
      ],
      projectId: 'test-project',
      req: {} as any,
    })

    // Own styling
    expect(html).toContain('PageComponent:root')
    // Package component styling override
    expect(html).toContain('test-package/ButtonWrapperComponent:root')
  })

  // Bug: https://discord.com/channels/972416966683926538/1471073500520386760
  test('should evaluate project formulas correctly inside package components', async () => {
    const packageWrapperComponent: Component = {
      name: 'PackageWrapperComponent',
      nodes: {
        root: {
          type: 'element',
          tag: 'span',
          attrs: {},
          children: ['childText'],
          events: {},
        },
        childText: {
          type: 'slot',
          children: [],
        },
      },
    }

    const pageComponent: PageComponent = {
      name: 'PageComponent',
      route: {
        path: [],
        query: {},
      },
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {},
          children: ['firstChild', 'secondChild'],
          events: {},
          style: {},
        },
        firstChild: {
          type: 'text',
          value: functionFormula('test-formula'),
        },
        secondChild: {
          type: 'component',
          name: 'PackageWrapperComponent',
          package: 'test-package',
          attrs: {},
          children: ['nestedChild'],
          events: {},
        },
        nestedChild: {
          type: 'text',
          value: functionFormula('test-formula'),
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
      events: [],
    }

    const files = {
      components: {
        PageComponent: pageComponent,
      },
      formulas: {
        'test-formula': {
          name: 'test-formula',
          formula: valueFormula('output-from-test-formula'),
          version: 2,
          arguments: [],
        },
      },
      packages: {
        'test-package': {
          manifest: {
            name: 'test-package',
            commit: '123',
          },
          components: {
            PackageWrapperComponent: packageWrapperComponent,
          },
        },
      },
    } as Pick<ProjectFiles, 'components' | 'formulas' | 'packages'>
    const formulaContext = getPageFormulaContext({
      component: pageComponent,
      branchName: 'main',
      req: new Request('http://localhost'),
      logErrors: true,
      files,
    })

    const { html } = await renderPageBody({
      evaluateComponentApis: () => ({}) as any,
      component: pageComponent as any,
      formulaContext,
      env: formulaContext.env,
      files,
      includedComponents: [pageComponent, packageWrapperComponent],
      projectId: 'test-project',
      req: {} as any,
    })
    // Expect the first child text node to render the formula value
    expect(html).toInclude(
      '<span data-node-type="text" data-node-id="firstChild">output-from-test-formula</span>',
    )
    // Expect the nested child text node inside the package component to also render the formula value,
    // proving that the formula is evaluated correctly even when used inside a package component
    expect(html).toInclude(
      '<span data-id="0.1" data-node-id="root" class="cYXIdv PageComponent:secondChild"><span data-node-type="text" data-node-id="nestedChild">output-from-test-formula</span></span>',
    )
  })

  // Bug: https://discord.com/channels/972416966683926538/1458387768504746068/1458387768504746068
  // TODO: Fix rendering so that context is properly passed through slots. Rendering should go through inner components before slotted content.
  test('should render context value when consumer is through multiple slots of a wrapped provider', async () => {
    // Four components required for test setup:
    // PageComponent - uses WrappedProviderComponent with a slotted ConsumerComponent
    // WrappedProviderComponent - uses ProviderComponent and passes slot to it
    // ProviderComponent - provides context value to its children through a slot
    // ConsumerComponent - consumes context value and renders it
    const pageComponent: Component = {
      name: 'PageComponent',
      nodes: {
        root: {
          type: 'component',
          name: 'WrappedProviderComponent',
          attrs: {},
          children: ['consumerSlot'],
          events: {},
          style: {},
        },
        consumerSlot: {
          type: 'component',
          name: 'ConsumerComponent',
          attrs: {},
          children: [],
          events: {},
          style: {},
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
      events: [],
    }

    const wrappedProviderComponent: Component = {
      name: 'WrappedProviderComponent',
      nodes: {
        root: {
          type: 'component',
          name: 'ProviderComponent',
          attrs: {},
          children: ['slot'],
          events: {},
          style: {},
        },
        slot: {
          type: 'slot',
          children: [],
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
      events: [],
    }

    const providerComponent: Component = {
      name: 'ProviderComponent',
      formulas: {
        contextValue: {
          name: 'contextValue',
          exposeInContext: true,
          formula: {
            type: 'value',
            value: 'provided-value',
          },
        },
      },
      nodes: {
        root: {
          type: 'slot',
          children: [],
        },
      },
    }

    const consumerComponent: Component = {
      name: 'ConsumerComponent',
      contexts: {
        ProviderComponent: {
          formulas: ['contextValue'],
          workflows: [],
        },
      },
      nodes: {
        root: {
          type: 'text',
          value: {
            type: 'path',
            path: ['Contexts', 'ProviderComponent', 'contextValue'],
          },
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
      events: [],
    }

    const { html } = await renderPageBody({
      evaluateComponentApis: () => ({}) as any,
      component: pageComponent as any,
      formulaContext: {
        data: {
          Attributes: {},
        },
        component: pageComponent,
        env: {} as any,
        package: undefined,
        toddle: {} as any,
      },
      env: {} as any,
      files: {
        components: {
          PageComponent: pageComponent,
          WrappedProviderComponent: wrappedProviderComponent,
          ProviderComponent: providerComponent,
          ConsumerComponent: consumerComponent,
        },
      } as any,
      includedComponents: [
        pageComponent,
        wrappedProviderComponent,
        providerComponent,
        consumerComponent,
      ],
      projectId: 'test-project',
      req: {} as any,
    })

    expect(html).toBe(
      `<span data-node-type="text" data-node-id="root">provided-value</span>`,
    )
  })

  test('should render a component where a variable initial value references Page.Theme', async () => {
    const component: Component = {
      name: 'ThemeVariableComponent',
      route: {
        path: [{ name: 'home', type: 'static' }],
        query: {},
        info: {
          theme: {
            formula: {
              type: 'value',
              value: 'dark',
            },
          },
        },
      },
      variables: {
        themeVar: {
          initialValue: {
            type: 'path',
            path: ['Page', 'Theme'],
          },
        },
      },
      nodes: {
        root: {
          type: 'text',
          value: {
            type: 'path',
            path: ['Variables', 'themeVar'],
          },
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      events: [],
    }

    const { html } = await renderPageBody({
      evaluateComponentApis: () => ({}) as any,
      component: component as any,
      formulaContext: getPageFormulaContext({
        component: component as any,
        branchName: 'main',
        req: new Request('http://localhost'),
        logErrors: true,
        files: {
          components: { ThemeVariableComponent: component },
        },
      }),
      env: {} as any,
      files: { components: { ThemeVariableComponent: component } } as any,
      includedComponents: [component],
      projectId: 'test-project',
      req: {} as any,
    })

    expect(html).toBe(
      '<span data-node-type="text" data-node-id="root">dark</span>',
    )
  })

  test('should render a component where Page.Theme references a variables initial value', async () => {
    const component: Component = {
      name: 'ThemeVariableComponent',
      route: {
        path: [{ name: 'home', type: 'static' }],
        query: {},
        info: {
          theme: {
            formula: {
              type: 'path',
              path: ['Variables', 'themeVar'],
            },
          },
        },
      },
      variables: {
        themeVar: {
          initialValue: {
            type: 'value',
            value: 'hotdog',
          },
        },
      },
      nodes: {
        root: {
          type: 'text',
          value: {
            type: 'path',
            path: ['Page', 'Theme'],
          },
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      events: [],
    }

    const { html } = await renderPageBody({
      evaluateComponentApis: () => ({}) as any,
      component: component as any,
      formulaContext: getPageFormulaContext({
        component: component as any,
        branchName: 'main',
        req: new Request('http://localhost'),
        logErrors: true,
        files: {
          components: { ThemeVariableComponent: component },
        },
      }),
      env: {} as any,
      files: { components: { ThemeVariableComponent: component } } as any,
      includedComponents: [component],
      projectId: 'test-project',
      req: {} as any,
    })

    expect(html).toBe(
      '<span data-node-type="text" data-node-id="root">hotdog</span>',
    )
  })

  test('should render a child component where a variable initial value references Page.Theme from the parent', async () => {
    const childComponent: Component = {
      name: 'ChildComponent',
      variables: {
        childThemeVar: {
          initialValue: {
            type: 'path',
            path: ['Page', 'Theme'],
          },
        },
      },
      nodes: {
        root: {
          type: 'text',
          value: {
            type: 'path',
            path: ['Variables', 'childThemeVar'],
          },
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      events: [],
    }

    const parentComponent: Component = {
      name: 'ParentComponent',
      route: {
        path: [{ name: 'home', type: 'static' }],
        query: {},
      },
      nodes: {
        root: {
          type: 'component',
          name: 'ChildComponent',
          attrs: {},
          children: [],
          events: {},
          style: {},
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
      events: [],
    }

    const { html } = await renderPageBody({
      evaluateComponentApis: () => ({}) as any,
      component: parentComponent as any,
      formulaContext: {
        data: {
          Attributes: {},
          Page: {
            Theme: 'light',
          },
        },
        component: parentComponent,
        env: {} as any,
        package: undefined,
        toddle: {} as any,
      },
      env: {} as any,
      files: {
        components: {
          ParentComponent: parentComponent,
          ChildComponent: childComponent,
        },
      } as any,
      includedComponents: [parentComponent, childComponent],
      projectId: 'test-project',
      req: {} as any,
    })

    expect(html).toBe(
      '<span data-node-type="text" data-node-id="root">light</span>',
    )
  })

  test('Component C should see the context value from Component A when Component B forwards its attribute using slots', async () => {
    // Component A: Provider
    // Accepts 'value' as attribute and provides it in context
    const componentA: Component = {
      name: 'ComponentA',
      attributes: {
        value: {
          name: 'value',
          testValue: 'test',
        },
      },
      formulas: {
        exposedValue: {
          name: 'exposedValue',
          exposeInContext: true,
          formula: {
            type: 'path',
            path: ['Attributes', 'value'],
          },
        },
      },
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {},
          children: ['slot_node'],
          events: {},
          style: {},
        },
        slot_node: {
          type: 'slot',
          name: 'default',
          children: [],
        },
      },
      contexts: {},
      apis: {},
      variables: {},
      events: [],
    }

    // Component B: Intermediary
    // Accepts 'val' as attribute and forwards it to Component A's 'value' attribute
    const componentB: Component = {
      name: 'ComponentB',
      attributes: {
        val: {
          name: 'val',
          testValue: 'test',
        },
      },
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {},
          children: ['provider_node'],
          events: {},
          style: {},
        },
        provider_node: {
          type: 'component',
          name: 'ComponentA',
          attrs: {
            value: {
              type: 'path',
              path: ['Attributes', 'val'],
            },
          },
          children: ['slot_forwarder'],
          events: {},
          style: {},
        },
        slot_forwarder: {
          type: 'slot',
          name: 'default',
          children: [],
        },
      },
      contexts: {},
      formulas: {},
      apis: {},
      variables: {},
      events: [],
    }

    // Component C: Consumer
    // Consumes Component A's context 'exposedValue'
    const componentC: Component = {
      name: 'ComponentC',
      contexts: {
        ComponentA: {
          formulas: ['exposedValue'],
          workflows: [],
        },
      },
      nodes: {
        root: {
          type: 'text',
          value: {
            type: 'path',
            path: ['Contexts', 'ComponentA', 'exposedValue'],
          },
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
      events: [],
    }

    // Root component that renders B with a specific value and C in its slot
    const rootComponent: any = {
      name: 'RootComponent',
      route: {
        path: [],
        query: {},
        info: {
          theme: {
            formula: { type: 'value', value: 'light' },
          },
        },
      },
      nodes: {
        root: {
          type: 'component',
          name: 'ComponentB',
          attrs: {
            val: {
              type: 'value',
              value: 'expected-value',
            },
          },
          children: ['consumer_node'],
          events: {},
          style: {},
        },
        consumer_node: {
          type: 'component',
          name: 'ComponentC',
          attrs: {},
          children: [],
          events: {},
          style: {},
          slot: 'default',
        },
      },
      contexts: {},
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
      events: [],
    }

    const files = {
      components: {
        RootComponent: rootComponent,
        ComponentB: componentB,
        ComponentA: componentA,
        ComponentC: componentC,
      },
    } as any

    const { html } = await renderPageBody({
      evaluateComponentApis: () => ({}) as any,
      component: rootComponent as any,
      formulaContext: getPageFormulaContext({
        component: rootComponent as any,
        branchName: 'main',
        req: new Request('http://localhost'),
        logErrors: true,
        files,
      }),
      env: {} as any,
      files,
      includedComponents: [rootComponent, componentB, componentA, componentC],
      projectId: 'test-project',
      req: {} as any,
    })

    // Component C should render 'expected-value'
    expect(html).toContain('expected-value')
  })

  test('should render ID formula with the expected order', async () => {
    const component: Component = {
      name: 'IdTestComponent',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {
            'data-custom-id': {
              type: 'function',
              name: '@toddle/concatenate',
              arguments: [
                {
                  name: '0',
                  formula: { type: 'value', value: 'custom' },
                  type: { type: 'Array \\| String \\| Object' },
                },
                {
                  name: '0',
                  formula: {
                    type: 'function',
                    name: '@toddle/Id',
                    arguments: [],
                    display_name: 'Id',
                  },
                  type: { type: 'Array \\| String \\| Object' },
                },
              ],
            },
          },
          children: [],
          events: {},
          style: {},
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
      events: [],
      route: {
        path: [],
        query: {},
      },
    }

    const { html } = await renderPageBody({
      evaluateComponentApis: () => ({}) as any,
      component: component as any,
      formulaContext: getPageFormulaContext({
        component: component as any,
        branchName: 'main',
        req: new Request('http://localhost'),
        logErrors: true,
        files: {
          components: { IdTestComponent: component },
        },
      }),
      env: {} as any,
      files: { components: { IdTestComponent: component } } as any,
      includedComponents: [component],
      projectId: 'test-project',
      req: {} as any,
    })

    // Expect the ID formula to render with the correct order (0 in this case since it's the first formula rendered)
    expect(html).toBe(
      `<div data-custom-id="custom_id_0_" data-id="0" data-node-id="root" class="ftaNwg"></div>`,
    )
  })
})
