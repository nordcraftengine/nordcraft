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

  test('should render a component where a variable initial value references Page.Theme', async () => {
    const component: Component = {
      name: 'ThemeVariableComponent',
      route: {
        path: [{ name: 'home', type: 'static' }],
        query: {},
      },
      variables: {
        themeVar: {
          name: 'themeVar',
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
      formulaContext: {
        data: {
          Attributes: {},
          Page: {
            Theme: 'dark',
          },
          Variables: {
            themeVar: 'dark',
          },
        },
        component,
        env: {} as any,
        package: undefined,
        toddle: {} as any,
      },
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

  test('should render a child component where a variable initial value references Page.Theme from the parent', async () => {
    const childComponent: Component = {
      name: 'ChildComponent',
      variables: {
        childThemeVar: {
          name: 'childThemeVar',
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
})
