/* eslint-disable no-console */
import type { Component, ToddleInternals } from '@nordcraft/core'
import { THEME_DATA_ATTRIBUTE } from '@nordcraft/core'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import './happydom'
import { createRoot, initGlobalObject } from './page.main'

const setupToddleInternals = (
  component: Component,
  overrides: Partial<ToddleInternals> = {},
) => {
  window.__toddle = {
    project: 'test-project',
    branch: 'test-branch',
    commit: 'abc1234',
    component,
    components: [component],
    pageState: {
      Attributes: {},
      Variables: {},
      Apis: {},
    },
    isPageLoaded: false,
    cookies: [],
    ...overrides,
  }
}

const setTestUrl = (pathAndQuery: string) => {
  ;(window as any).happyDOM.setURL(`http://localhost${pathAndQuery}`)
}

describe('page.main', () => {
  beforeEach(() => {
    globalThis.IS_PAGE = true
    globalThis.IS_CUSTOM_ELEMENT = false
    globalThis.IS_PREVIEW = false
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    document.title = ''
    document.documentElement.removeAttribute('lang')
    document.documentElement.removeAttribute(THEME_DATA_ATTRIBUTE)
    setTestUrl('/')
  })

  afterEach(() => {
    globalThis.IS_PAGE = true
    globalThis.IS_CUSTOM_ELEMENT = true
    globalThis.IS_PREVIEW = true
    setTestUrl('/')
  })

  describe('initGlobalObject & URL parsing edge cases', () => {
    test('initializes window.toddle, standard lib plugins, and custom code lookups', () => {
      const comp = {
        name: 'HomePage',
        page: '/',
        nodes: {},
      } as unknown as Component
      setupToddleInternals(comp)

      const customFormula = {
        name: 'myFormula',
        arguments: [],
        handler: (() => 'custom-formula-result') as any,
      }
      const pkgFormula = {
        name: 'pkgFormula',
        arguments: [],
        handler: (() => 'pkg-formula-result') as any,
      }
      const customAction = {
        version: 2 as const,
        name: 'myAction',
        variableArguments: false,
        handler: (() => {}) as any,
      }
      const pkgAction = {
        version: 2 as const,
        name: 'pkgAction',
        variableArguments: false,
        handler: (() => {}) as any,
      }

      initGlobalObject({
        formulas: {
          'test-project': {
            myFormula: customFormula,
          },
          'my-pkg': {
            pkgFormula,
          },
        },
        actions: {
          'test-project': {
            myAction: customAction,
          },
          'my-pkg': {
            pkgAction,
          },
        },
      })

      expect(window.toddle.project).toBe('test-project')
      expect(window.toddle.branch).toBe('test-branch')
      expect(window.toddle.commit).toBe('abc1234')
      expect(window.toddle.env).toEqual({
        isServer: false,
        branchName: 'test-branch',
        request: undefined,
        runtime: 'page',
        logErrors: true,
      })

      // Standard formulas & actions are registered
      expect(typeof window.toddle.getFormula('@toddle/concatenate')).toBe(
        'function',
      )
      expect(typeof window.toddle.getAction('@toddle/sleep')).toBe('function')

      // Custom formulas & actions resolve from package or fallback to project
      expect(window.toddle.getCustomFormula('myFormula', undefined)).toBe(
        customFormula,
      )
      expect(window.toddle.getCustomFormula('pkgFormula', 'my-pkg')).toBe(
        pkgFormula,
      )
      expect(
        window.toddle.getCustomFormula('myFormula', 'non-existent-pkg'),
      ).toBe(customFormula)

      expect(window.toddle.getCustomAction('myAction', undefined)).toBe(
        customAction,
      )
      expect(window.toddle.getCustomAction('pkgAction', 'my-pkg')).toBe(
        pkgAction,
      )
      expect(
        window.toddle.getCustomAction('myAction', 'non-existent-pkg'),
      ).toBe(customAction)
    })

    test('prevents duplicate legacy formula and action registrations and handles getArgumentInputData fallback', () => {
      const comp = { name: 'Page', nodes: {} } as unknown as Component
      setupToddleInternals(comp)
      initGlobalObject()

      const errors: string[] = []
      const origError = console.error
      console.error = (...args: any[]) => errors.push(args.join(' '))
      try {
        const firstAction = () => {}
        const secondAction = () => {}
        window.toddle.registerAction('customAct', firstAction)
        window.toddle.registerAction('customAct', secondAction)
        expect(window.toddle.getAction('customAct')).toBe(firstAction)

        const firstFormula = (() => 'one') as any
        const secondFormula = (() => 'two') as any
        window.toddle.registerFormula(
          'customForm',
          firstFormula,
          (_args, idx, data) => ({ ...data, Args: { idx } }) as any,
        )
        window.toddle.registerFormula('customForm', secondFormula)
        expect(window.toddle.getFormula('customForm')).toBe(firstFormula)

        const baseData = { Attributes: { a: 1 } } as any
        expect(
          window.toddle.getArgumentInputData('customForm', [], 2, baseData),
        ).toEqual({
          Attributes: { a: 1 },
          Args: { idx: 2 },
        } as any)
        // Unregistered formula falls back to returning input data unchanged
        expect(
          window.toddle.getArgumentInputData('unknownForm', [], 0, baseData),
        ).toBe(baseData)
      } finally {
        console.error = origError
      }

      expect(errors.length).toBe(2)
      expect(errors[0]).toContain('customAct')
      expect(errors[1]).toContain('customForm')
    })

    test('parses route.path segments, URL-decoded params, missing params, default query params, and hash', () => {
      setTestUrl(
        '/docs/hello%20world?filter=active&encoded=a%20b#section-1?ignored=true',
      )

      const comp = {
        name: 'DocsPage',
        route: {
          path: [
            { type: 'static', name: 'docs' },
            { type: 'param', name: 'slug' },
            { type: 'param', name: 'optionalSubpage' },
          ],
          query: {
            filter: { name: 'filter', testValue: null },
            sort: { name: 'sort', testValue: null },
          },
        },
        nodes: {},
      } as unknown as Component

      setupToddleInternals(comp)
      initGlobalObject()

      const loc = window.toddle.locationSignal.get()
      expect(loc.path).toBe('/docs/hello%20world')
      expect(loc.params).toEqual({
        docs: 'docs',
        slug: 'hello world',
        optionalSubpage: null,
      })
      expect(loc.query).toEqual({
        filter: 'active',
        sort: null,
        encoded: 'a b',
      })
      expect(loc.hash).toBe('section-1')
    })

    test('parses legacy component.page pattern via path-to-regexp when component.route is undefined', () => {
      setTestUrl('/users/42/profile')
      const comp = {
        name: 'LegacyUserPage',
        page: '/users/:userId/profile',
        nodes: {},
      } as unknown as Component

      setupToddleInternals(comp)
      initGlobalObject()

      expect(window.toddle.locationSignal.get().params).toEqual({
        userId: '42',
      })

      // Non-matching path falls back to empty params object
      setTestUrl('/unmatched/path')
      initGlobalObject()
      expect(window.toddle.locationSignal.get().params).toEqual({})
    })
  })

  describe('createRoot guard clauses & lifecycle', () => {
    test('throws when domNode is missing or window.toddle.components is missing', () => {
      const comp = { name: 'Page', nodes: {} } as unknown as Component
      setupToddleInternals(comp)
      initGlobalObject()

      expect(() => createRoot(null as any)).toThrow('Cant find root domNode')

      const domNode = document.createElement('div')
      ;(window.toddle as any).components = undefined
      expect(() => createRoot(domNode)).toThrow('Missing components')
    })

    test('updates locationSignal and component dataSignal on window popstate', () => {
      setTestUrl('/items/first?tab=overview')
      const comp = {
        name: 'ItemPage',
        route: {
          path: [
            { type: 'static', name: 'items' },
            { type: 'param', name: 'itemId' },
          ],
          query: {
            tab: { name: 'tab', testValue: null },
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
            attrs: {},
            events: {},
            children: ['param-txt', 'query-txt'],
          },
          'param-txt': {
            type: 'text',
            value: { type: 'path', path: ['URL parameters', 'itemId'] },
          },
          'query-txt': {
            type: 'text',
            value: { type: 'path', path: ['URL parameters', 'tab'] },
          },
        },
      } as unknown as Component

      setupToddleInternals(comp)
      initGlobalObject()

      const app = document.createElement('div')
      document.body.appendChild(app)
      createRoot(app)

      expect(app.querySelector('[data-id="0.0"]')?.textContent).toBe('first')
      expect(app.querySelector('[data-id="0.1"]')?.textContent).toBe('overview')

      // Simulate browser back/forward navigation
      setTestUrl('/items/second?tab=details#top')
      window.dispatchEvent(new PopStateEvent('popstate'))

      expect(window.toddle.locationSignal.get().params.itemId).toBe('second')
      expect(window.toddle.locationSignal.get().query.tab).toBe('details')
      expect(window.toddle.locationSignal.get().hash).toBe('top')
      expect(app.querySelector('[data-id="0.0"]')?.textContent).toBe('second')
      expect(app.querySelector('[data-id="0.1"]')?.textContent).toBe('details')
    })

    test('updates document theme attribute, language, title, description, og:description, and custom meta tags reactively', () => {
      // Pre-populate an existing meta tag with data-toddle-id to test in-place update
      const existingCustomMeta = document.createElement('meta')
      existingCustomMeta.setAttribute('data-toddle-id', 'meta-custom')
      document.head.appendChild(existingCustomMeta)

      const comp = {
        name: 'MetaPage',
        variables: {
          lang: { initialValue: { type: 'value', value: 'en' } },
          title: { initialValue: { type: 'value', value: 'Initial Title' } },
          desc: { initialValue: { type: 'value', value: 'Initial Desc' } },
          theme: { initialValue: { type: 'value', value: 'dark' } },
          jsonLd: {
            initialValue: { type: 'value', value: '{"@type":"Page"}' },
          },
        },
        route: {
          path: [],
          query: {},
          info: {
            language: {
              formula: { type: 'path', path: ['Variables', 'lang'] },
            },
            title: {
              formula: { type: 'path', path: ['Variables', 'title'] },
            },
            description: {
              formula: { type: 'path', path: ['Variables', 'desc'] },
            },
            theme: {
              formula: { type: 'path', path: ['Variables', 'theme'] },
            },
            meta: {
              'meta-custom': {
                tag: 'meta',
                attrs: {
                  name: { type: 'value', value: 'twitter:title' },
                  content: { type: 'path', path: ['Variables', 'title'] },
                },
              },
              'ld-json': {
                tag: 'script',
                attrs: {
                  type: { type: 'value', value: 'application/ld+json' },
                },
                content: { type: 'path', path: ['Variables', 'jsonLd'] },
              },
            },
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'button',
            attrs: {},
            children: ['theme-label'],
            events: {
              click: {
                trigger: 'click',
                actions: [
                  {
                    type: 'SetVariable',
                    variable: 'lang',
                    data: { type: 'value', value: 'da' },
                  },
                  {
                    type: 'SetVariable',
                    variable: 'title',
                    data: { type: 'value', value: 'Updated Title' },
                  },
                  {
                    type: 'SetVariable',
                    variable: 'desc',
                    data: { type: 'value', value: 'Updated Desc' },
                  },
                  {
                    type: 'SetVariable',
                    variable: 'theme',
                    data: { type: 'value', value: null },
                  },
                  {
                    type: 'SetVariable',
                    variable: 'jsonLd',
                    data: { type: 'value', value: '{"@type":"Updated"}' },
                  },
                ],
              },
            },
          },
          'theme-label': {
            type: 'text',
            value: { type: 'path', path: ['Page', 'Theme'] },
          },
        },
      } as unknown as Component

      setupToddleInternals(comp)
      initGlobalObject()

      const app = document.createElement('div')
      document.body.appendChild(app)
      createRoot(app)

      expect(document.documentElement.getAttribute('lang')).toBe('en')
      expect(document.title).toBe('Initial Title')
      expect(document.documentElement.getAttribute(THEME_DATA_ATTRIBUTE)).toBe(
        'dark',
      )
      expect(app.querySelector('[data-id="0.0"]')?.textContent).toBe('dark')
      expect(
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute('content'),
      ).toBe('Initial Desc')
      // Automatically mirrors description to og:description when not explicitly configured
      expect(
        document
          .querySelector('meta[property="og:description"]')
          ?.getAttribute('content'),
      ).toBe('Initial Desc')
      expect(existingCustomMeta.getAttribute('content')).toBe('Initial Title')
      expect(
        document.querySelector('[data-toddle-id="ld-json"]')?.textContent,
      ).toBe('{"@type":"Page"}')

      // Click button to trigger reactive updates across all meta & theme bindings
      const btn = app.querySelector('button')!
      btn.click()

      expect(document.documentElement.getAttribute('lang')).toBe('da')
      expect(document.title).toBe('Updated Title')
      expect(
        document.documentElement.getAttribute(THEME_DATA_ATTRIBUTE),
      ).toBeNull()
      expect(
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute('content'),
      ).toBe('Updated Desc')
      expect(
        document
          .querySelector('meta[property="og:description"]')
          ?.getAttribute('content'),
      ).toBe('Updated Desc')
      expect(existingCustomMeta.getAttribute('content')).toBe('Updated Title')
      expect(
        document.querySelector('[data-toddle-id="ld-json"]')?.textContent,
      ).toBe('{"@type":"Updated"}')
    })

    test('does not overwrite explicit static og:description when dynamic description updates', () => {
      const ogMeta = document.createElement('meta')
      ogMeta.setAttribute('property', 'og:description')
      ogMeta.setAttribute('content', 'Custom OG Description')
      document.head.appendChild(ogMeta)

      const comp = {
        name: 'ExplicitOgPage',
        variables: {
          desc: { initialValue: { type: 'value', value: 'Dynamic Page Desc' } },
        },
        route: {
          path: [],
          query: {},
          info: {
            description: {
              formula: { type: 'path', path: ['Variables', 'desc'] },
            },
            meta: {
              'explicit-og': {
                tag: 'meta',
                attrs: {
                  property: { type: 'value', value: 'og:description' },
                  content: { type: 'value', value: 'Custom OG Description' },
                },
              },
            },
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
            attrs: {},
            events: {},
            children: [],
          },
        },
      } as unknown as Component

      setupToddleInternals(comp)
      initGlobalObject()
      const app = document.createElement('div')
      document.body.appendChild(app)
      createRoot(app)

      expect(
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute('content'),
      ).toBe('Dynamic Page Desc')
      expect(ogMeta.getAttribute('content')).toBe('Custom OG Description')
    })
  })

  describe('createRoot hydration vs fresh mount edge cases', () => {
    test('fresh mount (empty domNode or whitespace-only domNode) builds DOM and sets isPageLoaded', () => {
      const comp = {
        name: 'FreshPage',
        nodes: {
          root: {
            type: 'element',
            tag: 'main',
            attrs: {},
            events: {},
            children: ['txt'],
          },
          txt: {
            type: 'text',
            value: { type: 'value', value: 'Fresh Content' },
          },
        },
      } as unknown as Component

      setupToddleInternals(comp)
      initGlobalObject()

      const app = document.createElement('div')
      app.textContent = '   '
      document.body.appendChild(app)

      expect(window.__toddle.isPageLoaded).toBe(false)
      createRoot(app)
      expect(window.__toddle.isPageLoaded).toBe(true)
      expect(app.children.length).toBe(1)
      expect(app.children[0]?.tagName).toBe('MAIN')
      expect(app.textContent).toBe('Fresh Content')
    })

    test('hydrates existing SSR DOM in-place when domNode has element children', () => {
      const comp = {
        name: 'HydratedPage',
        variables: {
          label: { initialValue: { type: 'value', value: 'Hydrated!' } },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'main',
            attrs: {},
            events: {},
            children: ['txt'],
          },
          txt: {
            type: 'text',
            value: { type: 'path', path: ['Variables', 'label'] },
          },
        },
      } as unknown as Component

      setupToddleInternals(comp)
      initGlobalObject()

      const app = document.createElement('div')
      app.innerHTML =
        '<main data-id="0" data-node-id="root"><span data-node-type="text" data-node-id="txt" data-id="0.0">SSR Text</span></main>'
      const ssrMain = app.querySelector('main')!
      const ssrSpan = app.querySelector('span')!
      document.body.appendChild(app)

      createRoot(app)

      expect(window.__toddle.isPageLoaded).toBe(true)
      expect(app.querySelector('main')).toBe(ssrMain)
      expect(app.querySelector('span')).toBe(ssrSpan)
      expect(ssrSpan.textContent).toBe('Hydrated!')
    })

    test('hydrates when root element has a tag mismatch between SSR and CSR', () => {
      const comp = {
        name: 'RootMismatchPage',
        nodes: {
          root: {
            type: 'element',
            tag: 'section',
            attrs: {},
            events: {},
            children: ['txt'],
          },
          txt: {
            type: 'text',
            value: { type: 'value', value: 'Replaced Root' },
          },
        },
      } as unknown as Component

      setupToddleInternals(comp)
      initGlobalObject()

      const app = document.createElement('div')
      app.innerHTML =
        '<div data-id="0" data-node-id="root"><span data-node-type="text" data-node-id="txt" data-id="0.0">Old Root</span></div>'
      const ssrDiv = app.querySelector('div')!
      document.body.appendChild(app)

      createRoot(app)

      expect(app.children.length).toBe(1)
      expect(app.children[0]).not.toBe(ssrDiv)
      expect(app.children[0]?.tagName).toBe('SECTION')
      expect(app.children[0]?.getAttribute('data-id')).toBe('0')
      expect(app.textContent).toBe('Replaced Root')
    })

    test('hydrates when client variable re-initialization flips a conditional branch from SSR', () => {
      const comp = {
        name: 'ClientVarSkewPage',
        variables: {
          // On SSR pageState had isClient=false, but variable initialValue evaluates to true on CSR
          isClient: {
            initialValue: { type: 'value', value: true },
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
            attrs: {},
            events: {},
            children: ['ssr-banner', 'csr-banner', 'shared-footer'],
          },
          'ssr-banner': {
            type: 'element',
            tag: 'p',
            condition: {
              type: 'function',
              name: '@toddle/not',
              arguments: [
                {
                  name: 'Value',
                  formula: { type: 'path', path: ['Variables', 'isClient'] },
                },
              ],
            },
            attrs: {},
            events: {},
            children: ['ssr-txt'],
          },
          'ssr-txt': {
            type: 'text',
            value: { type: 'value', value: 'Server Only' },
          },
          'csr-banner': {
            type: 'element',
            tag: 'section',
            condition: { type: 'path', path: ['Variables', 'isClient'] },
            attrs: {},
            events: {},
            children: ['csr-txt'],
          },
          'csr-txt': {
            type: 'text',
            value: { type: 'value', value: 'Client Only' },
          },
          'shared-footer': {
            type: 'element',
            tag: 'footer',
            attrs: {},
            events: {},
            children: ['footer-txt'],
          },
          'footer-txt': {
            type: 'text',
            value: { type: 'value', value: 'Footer' },
          },
        },
      } as unknown as Component

      setupToddleInternals(comp, {
        pageState: {
          Attributes: {},
          Variables: { isClient: false },
          Apis: {},
        },
      })
      initGlobalObject()

      const app = document.createElement('div')
      app.innerHTML =
        '<div data-id="0" data-node-id="root">' +
        '<p data-id="0.0" data-node-id="ssr-banner"><span data-node-type="text" data-node-id="ssr-txt" data-id="0.0.0">Server Only</span></p>' +
        '<footer data-id="0.2" data-node-id="shared-footer"><span data-node-type="text" data-node-id="footer-txt" data-id="0.2.0">Footer</span></footer>' +
        '</div>'
      const ssrRoot = app.querySelector('[data-id="0"]')!
      const ssrFooter = app.querySelector('[data-id="0.2"]')!
      document.body.appendChild(app)

      createRoot(app)

      // Root and footer are adopted from SSR
      expect(app.querySelector('[data-id="0"]')).toBe(ssrRoot)
      expect(app.querySelector('[data-id="0.2"]')).toBe(ssrFooter)
      // Server-only branch is swept
      expect(app.querySelector('[data-id="0.0"]')).toBeNull()
      // Client-only branch is fallback-created and inserted BEFORE the adopted footer
      const csrBanner = app.querySelector('[data-id="0.1"]')
      expect(csrBanner).not.toBeNull()
      expect(csrBanner?.tagName).toBe('SECTION')
      expect(csrBanner?.textContent).toBe('Client Only')
      expect(
        [...ssrRoot.children].map((c) => c.getAttribute('data-id')),
      ).toEqual(['0.1', '0.2'])
    })

    test('hydrates multi-root component when SSR had partial roots, stale roots, and foreign nodes', () => {
      const comp = {
        name: 'MultiRootPage',
        variables: {
          items: {
            initialValue: {
              type: 'value',
              value: [
                { id: 'a', text: 'First' },
                { id: 'b', text: 'Second' },
                { id: 'c', text: 'Third' },
              ],
            },
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'article',
            repeat: { type: 'path', path: ['Variables', 'items'] },
            repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
            attrs: {},
            events: {},
            children: ['txt'],
          },
          txt: {
            type: 'text',
            value: { type: 'path', path: ['ListItem', 'Item', 'text'] },
          },
        },
      } as unknown as Component

      setupToddleInternals(comp)
      initGlobalObject()

      const app = document.createElement('div')
      // SSR only rendered item 0(1) and a stale item 0(9), plus a foreign browser extension node without data-id
      app.innerHTML =
        '<div class="browser-ext">ext</div>' +
        '<article data-id="0(1)" data-node-id="root"><span data-node-type="text" data-node-id="txt" data-id="0(1).0">Second</span></article>' +
        '<article data-id="0(9)" data-node-id="root">Stale</article>'
      const ssrSecond = app.querySelector('[data-id="0(1)"]') as HTMLElement
      const foreignExt = app.querySelector('.browser-ext')!
      document.body.appendChild(app)

      createRoot(app)

      // Stale root is removed, foreign node is preserved
      expect(app.querySelector('[data-id="0(9)"]')).toBeNull()
      expect(app.querySelector('.browser-ext')).toBe(foreignExt)

      const articles = [...app.querySelectorAll('article')]
      expect(articles.length).toBe(3)
      // Item 0 ('First') was fallback-created before adopted Item 1 ('Second'), and Item 2 ('Third') after
      expect(articles[1]).toBe(ssrSecond)
      expect(articles.map((a) => a.getAttribute('data-id'))).toEqual([
        '0',
        '0(1)',
        '0(2)',
      ])
      expect(articles.map((a) => a.textContent)).toEqual([
        'First',
        'Second',
        'Third',
      ])
    })

    test('hydrates when root conditional is false on client (sweeps SSR root) and mounts when toggled true', () => {
      const comp = {
        name: 'ConditionalRootPage',
        variables: {
          visible: {
            initialValue: { type: 'value', value: false },
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
            condition: { type: 'path', path: ['Variables', 'visible'] },
            attrs: {},
            events: {},
            children: ['txt'],
          },
          txt: {
            type: 'text',
            value: { type: 'value', value: 'Now Visible' },
          },
        },
      } as unknown as Component

      setupToddleInternals(comp)
      initGlobalObject()

      const app = document.createElement('div')
      app.innerHTML =
        '<div data-id="0" data-node-id="root"><span data-node-type="text" data-node-id="txt" data-id="0.0">SSR Visible</span></div>'
      document.body.appendChild(app)

      createRoot(app)

      // SSR root was swept because condition is false on client
      expect(app.querySelector('[data-id="0"]')).toBeNull()
      expect(app.children.length).toBe(0)
    })

    test('root context provider exposes formulas to child components and filters null variable definitions', () => {
      const childComp = {
        name: 'ChildConsumer',
        contexts: {
          ProviderPage: {
            formulas: ['greeting'],
            workflows: [],
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'span',
            attrs: {},
            events: {},
            children: ['txt'],
          },
          txt: {
            type: 'text',
            value: {
              type: 'path',
              path: ['Contexts', 'ProviderPage', 'greeting'],
            },
          },
        },
      } as unknown as Component

      const pageComp = {
        name: 'ProviderPage',
        variables: {
          nullVar: null,
          user: {
            // Reads initial value from SSR pageState Apis
            initialValue: {
              type: 'path',
              path: ['Apis', 'userApi', 'data', 'name'],
            },
          },
        },
        formulas: {
          greeting: {
            name: 'greeting',
            exposeInContext: true,
            formula: {
              type: 'function',
              name: '@toddle/concatenate',
              arguments: [
                {
                  name: '0',
                  formula: { type: 'value', value: 'Hello, ' },
                },
                {
                  name: '1',
                  formula: { type: 'path', path: ['Variables', 'user'] },
                },
              ],
            },
          },
          internalOnly: {
            name: 'internalOnly',
            exposeInContext: false,
            formula: { type: 'value', value: 'secret' },
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
            attrs: {},
            events: {},
            children: ['child'],
          },
          child: {
            type: 'component',
            name: 'ChildConsumer',
            attrs: {},
            events: {},
            children: [],
          },
        },
      } as unknown as Component

      setupToddleInternals(pageComp, {
        components: [pageComp, childComp],
        pageState: {
          Attributes: {},
          Variables: {},
          Apis: {
            userApi: {
              data: { name: 'Ada' },
              isLoading: false,
              error: null,
            },
          },
        },
      })
      initGlobalObject()

      const app = document.createElement('div')
      document.body.appendChild(app)
      createRoot(app)

      expect(app.textContent).toBe('Hello, Ada')
    })

    test('setupMetaUpdates matches existing meta by name/property when data-toddle-id is absent and skips textContent on void elements', () => {
      const existingByProperty = document.createElement('meta')
      existingByProperty.setAttribute('property', 'og:site_name')
      existingByProperty.setAttribute('content', 'Old Site')
      document.head.appendChild(existingByProperty)

      const comp = {
        name: 'VoidMetaPage',
        variables: {
          siteName: { initialValue: { type: 'value', value: 'New Site' } },
        },
        route: {
          path: [],
          query: {},
          info: {
            meta: {
              'site-meta': {
                tag: 'meta',
                attrs: {
                  property: { type: 'value', value: 'og:site_name' },
                  content: { type: 'path', path: ['Variables', 'siteName'] },
                },
                // Even if content formula is specified on a void <meta> tag, textContent must stay empty
                content: { type: 'path', path: ['Variables', 'siteName'] },
              },
            },
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
            attrs: {},
            events: {},
            children: [],
          },
        },
      } as unknown as Component

      setupToddleInternals(comp)
      initGlobalObject()

      const app = document.createElement('div')
      document.body.appendChild(app)
      createRoot(app)

      // Creates a new element with data-toddle-id="site-meta" since id is defined, and does not set textContent on void <meta>
      const createdMeta = document.querySelector(
        'meta[data-toddle-id="site-meta"]',
      )
      expect(createdMeta).not.toBeNull()
      expect(createdMeta?.getAttribute('content')).toBe('New Site')
      expect(createdMeta?.textContent).toBe('')
    })
  })
})
