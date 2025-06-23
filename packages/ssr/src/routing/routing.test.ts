import type { PageComponent } from '@nordcraft/core/dist/component/component.types'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { serverEnv } from '../rendering/formulaContext'
import type { Route } from '../ssr.types'
import { matchPageForUrl, matchRouteForUrl } from './routing'

describe('matchPageForUrl', () => {
  test('it finds the correct page for a url', () => {
    const searchPage: Pick<PageComponent, 'name' | 'route'> = {
      name: 'searchPage',
      route: { path: [{ type: 'static', name: 'search' }], query: {} },
    }
    const categoryPage: Pick<PageComponent, 'name' | 'route'> = {
      name: 'categoryPage',
      route: {
        path: [{ type: 'param', name: 'category', testValue: 'fruit' }],
        query: {},
      },
    }
    const docsPage: Pick<PageComponent, 'name' | 'route'> = {
      name: 'docsPage',
      route: {
        path: [
          { type: 'static', name: 'docs' },
          { type: 'param', testValue: '', name: 'docs-page' },
        ],
        query: {},
      },
    }
    const helloPage: Pick<PageComponent, 'name' | 'route'> = {
      name: 'helloPage',
      route: {
        path: [
          { type: 'param', name: 'test', testValue: '' },
          { type: 'static', name: 'hello' },
        ],
        query: {},
      },
    }
    const otherPage: Pick<PageComponent, 'name' | 'route'> = {
      name: 'otherPage',
      route: {
        path: [
          { type: 'param', name: 'other', testValue: '' },
          { type: 'param', name: 'page', testValue: '' },
        ],
        query: {},
      },
    }
    const pages = [searchPage, categoryPage, docsPage, helloPage, otherPage]

    const searchUrl = new URL('http://localhost:3000/search')
    expect(matchPageForUrl({ url: searchUrl, pages })).toEqual({
      name: 'searchPage',
      route: searchPage,
    })
    const categoryUrl = new URL('http://localhost:3000/fruit')
    expect(matchPageForUrl({ url: categoryUrl, pages })).toEqual({
      name: 'categoryPage',
      route: categoryPage,
    })
    const docsUrl = new URL('http://localhost:3000/docs/intro')
    expect(matchPageForUrl({ url: docsUrl, pages })).toEqual({
      name: 'docsPage',
      route: docsPage,
    })
    const helloUrl = new URL('http://localhost:3000/bla/hello')
    expect(matchPageForUrl({ url: helloUrl, pages })).toEqual({
      name: 'helloPage',
      route: helloPage,
    })
    const otherUrl = new URL('http://localhost:3000/hello/world')
    expect(matchPageForUrl({ url: otherUrl, pages })).toEqual({
      name: 'otherPage',
      route: otherPage,
    })
  })
  test('it prefers static path segments in urls', () => {
    const otherPage: Pick<PageComponent, 'name' | 'route'> = {
      name: 'otherPage',
      route: {
        path: [
          // /:other/:page
          { type: 'param', name: 'other', testValue: '' },
          { type: 'param', name: 'page', testValue: '' },
        ],
        query: {},
      },
    }
    const guidesPage: Pick<PageComponent, 'name' | 'route'> = {
      name: 'guidesPage',
      route: {
        path: [
          // /guides/:p1/:p2
          { type: 'static', name: 'guides' },
          { type: 'param', name: 'p1', testValue: '' },
          { type: 'param', name: 'p2', testValue: '' },
        ],
        query: {},
      },
    }
    const pages = [otherPage, guidesPage]
    const guidesUrl = new URL('http://localhost:3000/guides/category/explore')
    expect(matchPageForUrl({ url: guidesUrl, pages })).toEqual({
      name: 'guidesPage',
      route: guidesPage,
    })
    const guidesUrl2 = new URL('http://localhost:3000/guides')
    expect(matchPageForUrl({ url: guidesUrl2, pages })).toEqual({
      name: 'guidesPage',
      route: guidesPage,
    })
    const guidesUrl3 = new URL('http://localhost:3000/test')
    expect(matchPageForUrl({ url: guidesUrl3, pages })).toEqual({
      name: 'otherPage',
      route: otherPage,
    })
    const guidesUrl4 = new URL('http://localhost:3000/test/hello')
    expect(matchPageForUrl({ url: guidesUrl4, pages })).toEqual({
      name: 'otherPage',
      route: otherPage,
    })
    const guidesUrl5 = new URL('http://localhost:3000/test/hello/world')
    expect(matchPageForUrl({ url: guidesUrl5, pages })).toBeUndefined()
  })
  test('it does not find a match for unknown paths', () => {
    const pages: Pick<PageComponent, 'name' | 'route'>[] = [
      {
        name: 'otherPage',
        route: {
          path: [{ type: 'static', name: 'search' }],
          query: {},
        },
      },
      {
        name: 'guidesPage',
        route: {
          path: [
            // /:other/page
            { type: 'param', name: 'other', testValue: '' },
            { type: 'static', name: 'page' },
          ],
          query: {},
        },
      },
    ]
    const categoryUrl = new URL('http://localhost:3000/fruit')
    expect(matchPageForUrl({ url: categoryUrl, pages })).toBeUndefined()
    const docsUrl = new URL('http://localhost:3000/docs/intro/help')
    expect(matchPageForUrl({ url: docsUrl, pages })).toBeUndefined()
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
