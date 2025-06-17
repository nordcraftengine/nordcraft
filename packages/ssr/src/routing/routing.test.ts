import type { PageComponent } from '@nordcraft/core/dist/component/component.types'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { serverEnv } from '../rendering/formulaContext'
import type { Route } from '../ssr.types'
import { matchPageForUrl, matchRouteForUrl } from './routing'

describe('matchPageForUrl', () => {
  test('it finds the correct page for a url', () => {
    const pages: Record<string, PageComponent> = {
      searchPage: {
        name: 'searchPage',
        attributes: {},
        variables: {},
        apis: {},
        nodes: {},
        route: { path: [{ type: 'static', name: 'search' }], query: {} },
      },
      categoryPage: {
        name: 'categoryPage',
        attributes: {},
        variables: {},
        apis: {},
        nodes: {},
        route: {
          path: [{ type: 'param', name: 'category', testValue: 'fruit' }],
          query: {},
        },
      },
      docsPage: {
        name: 'docsPage',
        attributes: {},
        variables: {},
        apis: {},
        nodes: {},
        route: {
          path: [
            { type: 'static', name: 'docs' },
            { type: 'param', testValue: '', name: 'docs-page' },
          ],
          query: {},
        },
      },
      helloPage: {
        name: 'helloPage',
        attributes: {},
        variables: {},
        apis: {},
        nodes: {},
        route: {
          path: [
            { type: 'param', name: 'test', testValue: '' },
            { type: 'static', name: 'hello' },
          ],
          query: {},
        },
      },
      otherPage: {
        name: 'otherPage',
        attributes: {},
        variables: {},
        apis: {},
        nodes: {},
        route: {
          path: [
            { type: 'param', name: 'other', testValue: '' },
            { type: 'param', name: 'page', testValue: '' },
          ],
          query: {},
        },
      },
    }

    const searchUrl = new URL('http://localhost:3000/search')
    expect(matchPageForUrl({ url: searchUrl, components: pages })).toEqual({
      name: 'searchPage',
      route: pages['searchPage'],
    })
    const categoryUrl = new URL('http://localhost:3000/fruit')
    expect(matchPageForUrl({ url: categoryUrl, components: pages })).toEqual({
      name: 'categoryPage',
      route: pages['categoryPage'],
    })
    const docsUrl = new URL('http://localhost:3000/docs/intro')
    expect(matchPageForUrl({ url: docsUrl, components: pages })).toEqual({
      name: 'docsPage',
      route: pages['docsPage'],
    })
    const helloUrl = new URL('http://localhost:3000/bla/hello')
    expect(matchPageForUrl({ url: helloUrl, components: pages })).toEqual({
      name: 'helloPage',
      route: pages['helloPage'],
    })
    const otherUrl = new URL('http://localhost:3000/hello/world')
    expect(matchPageForUrl({ url: otherUrl, components: pages })).toEqual({
      name: 'otherPage',
      route: pages['otherPage'],
    })
  })
  test('it prefers static path segments in urls', () => {
    const pages: Record<string, PageComponent> = {
      otherPage: {
        name: 'otherPage',
        attributes: {},
        variables: {},
        apis: {},
        nodes: {},
        route: {
          path: [
            // /:other/:page
            { type: 'param', name: 'other', testValue: '' },
            { type: 'param', name: 'page', testValue: '' },
          ],
          query: {},
        },
      },
      guidesPage: {
        name: 'guidesPage',
        attributes: {},
        variables: {},
        apis: {},
        nodes: {},
        route: {
          path: [
            // /guides/:p1/:p2
            { type: 'static', name: 'guides' },
            { type: 'param', name: 'p1', testValue: '' },
            { type: 'param', name: 'p2', testValue: '' },
          ],
          query: {},
        },
      },
    }
    const guidesUrl = new URL('http://localhost:3000/guides/category/explore')
    expect(matchPageForUrl({ url: guidesUrl, components: pages })).toEqual({
      name: 'guidesPage',
      route: pages['guidesPage'],
    })
    const guidesUrl2 = new URL('http://localhost:3000/guides')
    expect(matchPageForUrl({ url: guidesUrl2, components: pages })).toEqual({
      name: 'guidesPage',
      route: pages['guidesPage'],
    })
    const guidesUrl3 = new URL('http://localhost:3000/test')
    expect(matchPageForUrl({ url: guidesUrl3, components: pages })).toEqual({
      name: 'otherPage',
      route: pages['otherPage'],
    })
    const guidesUrl4 = new URL('http://localhost:3000/test/hello')
    expect(matchPageForUrl({ url: guidesUrl4, components: pages })).toEqual({
      name: 'otherPage',
      route: pages['otherPage'],
    })
    const guidesUrl5 = new URL('http://localhost:3000/test/hello/world')
    expect(
      matchPageForUrl({ url: guidesUrl5, components: pages }),
    ).toBeUndefined()
  })
  test('it does not find a match for unknown paths', () => {
    const pages: Record<string, PageComponent> = {
      otherPage: {
        name: 'otherPage',
        attributes: {},
        variables: {},
        apis: {},
        nodes: {},
        route: {
          path: [{ type: 'static', name: 'search' }],
          query: {},
        },
      },
      guidesPage: {
        name: 'guidesPage',
        attributes: {},
        variables: {},
        apis: {},
        nodes: {},
        route: {
          path: [
            // /:other/page
            { type: 'param', name: 'other', testValue: '' },
            { type: 'static', name: 'page' },
          ],
          query: {},
        },
      },
    }
    const categoryUrl = new URL('http://localhost:3000/fruit')
    expect(
      matchPageForUrl({ url: categoryUrl, components: pages }),
    ).toBeUndefined()
    const docsUrl = new URL('http://localhost:3000/docs/intro/help')
    expect(matchPageForUrl({ url: docsUrl, components: pages })).toBeUndefined()
  })
})
describe('matchRouteForUrl', () => {
  test('it finds the correct route for a url', () => {
    const routes: Record<string, Route> = {
      testRedirect: {
        type: 'redirect',
        source: {
          path: [
            { type: 'static', name: 'not-docs' },
            { type: 'param', testValue: '', name: 'slug' },
          ],
          query: {},
        },
        destination: {
          url: { type: 'value', value: 'https://google.com' },
          path: {},
        },
      },
      docsRedirect: {
        type: 'redirect',
        source: {
          path: [
            { type: 'static', name: 'docs' },
            { type: 'param', testValue: '', name: 'slug' },
          ],
          query: {},
        },
        destination: {
          url: { type: 'value', value: 'https://docs.nordcraft.com' },
          path: {
            first: {
              index: 0,
              formula: valueFormula('slug'),
            },
          },
        },
      },
    }

    const docsUrl = new URL('http://localhost:3000/docs/intro')
    const request = new Request(docsUrl)
    expect(
      matchRouteForUrl({
        url: docsUrl,
        routes,
        env: serverEnv({
          branchName: 'main',
          req: request,
          logErrors: false,
        }),
        req: request,
        serverContext: {
          errors: [],
          getFormula: () => undefined,
          getCustomFormula: () => undefined,
        },
      }),
    ).toEqual({ name: 'docsRedirect', route: routes['docsRedirect'] })
  })
  test('it ignores disabled routes', () => {
    const routes: Record<string, Route> = {
      disabledRedirect: {
        type: 'redirect',
        enabled: { formula: valueFormula(false) },
        source: {
          path: [
            { type: 'static', name: 'docs' },
            { type: 'param', testValue: '', name: 'slug' },
          ],
          query: {},
        },
        destination: {
          url: { type: 'value', value: 'https://docs.nordcraft.com' },
          path: {
            first: {
              index: 0,
              formula: valueFormula('slug'),
            },
          },
        },
      },
      docsRedirect: {
        type: 'redirect',
        source: {
          path: [
            { type: 'param', testValue: 'docs', name: 'docs' },
            { type: 'param', testValue: '', name: 'slug' },
          ],
          query: {},
        },
        destination: {
          url: { type: 'value', value: 'https://docs.nordcraft.com' },
          path: {
            first: {
              index: 0,
              formula: valueFormula('slug'),
            },
          },
        },
      },
    }

    const docsUrl = new URL('http://localhost:3000/docs/intro')
    const request = new Request(docsUrl)
    expect(
      matchRouteForUrl({
        url: docsUrl,
        routes,
        env: serverEnv({
          branchName: 'main',
          req: request,
          logErrors: false,
        }),
        req: request,
        serverContext: {
          errors: [],
          getFormula: () => undefined,
          getCustomFormula: () => undefined,
        },
      }),
    ).toEqual({ name: 'docsRedirect', route: routes['docsRedirect'] })
  })
})
