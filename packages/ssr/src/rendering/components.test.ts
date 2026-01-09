import type { Component } from '@nordcraft/core/dist/component/component.types'
import { renderPageBody } from './components'

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

  // Disabled test

  // Bug: https://discord.com/channels/972416966683926538/1458387768504746068/1458387768504746068
  // TODO: Fix rendering so that context is properly passed through slots. Rendering should go through inner components before slotted content.
  test.failing(
    'should render context value when consumer is through multiple slots of a wrapped provider',
    async () => {
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
        `"<span data-node-type="text" data-node-id="root">provided-value</span>"`,
      )
    },
  )
})
