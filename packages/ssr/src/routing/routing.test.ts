import { describe, expect, test } from '@jest/globals'
import type {
  PageComponent,
  PageRoute,
} from '@nordcraft/core/dist/component/component.types'
import type { ProjectFiles } from '../ssr.types'
import { matchPageForUrl } from './routing'

describe('matchPageForUrl', () => {
  test('it finds the correct page for a url', () => {
    const routes: PageRoute['path'][] = [
      // /search
      [{ type: 'static', name: 'search' }],
      // /:category
      [{ type: 'param', testValue: '', name: 'category' }],
      [
        // /docs/:docs-page
        { type: 'static', name: 'docs' },
        { type: 'param', testValue: '', name: 'docs-page' },
      ],
      [
        // /:test/hello
        { type: 'param', name: 'test', testValue: '' },
        { type: 'static', name: 'hello' },
      ],
      [
        // /:other/:page
        { type: 'param', name: 'other', testValue: '' },
        { type: 'param', name: 'page', testValue: '' },
      ],
    ]

    const pages: ProjectFiles['components'] = Object.fromEntries(
      routes.map((path, i): [string, PageComponent] => [
        `${i}`,
        {
          name: `page-${i}`,
          attributes: {},
          variables: {},
          apis: {},
          nodes: {},
          route: { path, query: {} },
        },
      ]),
    )
    const searchUrl = new URL('http://localhost:3000/search')
    expect(matchPageForUrl({ url: searchUrl, components: pages })).toEqual(
      pages[0],
    )
    const categoryUrl = new URL('http://localhost:3000/fruit')
    expect(matchPageForUrl({ url: categoryUrl, components: pages })).toEqual(
      pages[1],
    )
    const docsUrl = new URL('http://localhost:3000/docs/intro')
    expect(matchPageForUrl({ url: docsUrl, components: pages })).toEqual(
      pages[2],
    )
    const helloUrl = new URL('http://localhost:3000/bla/hello')
    expect(matchPageForUrl({ url: helloUrl, components: pages })).toEqual(
      pages[3],
    )
    const otherUrl = new URL('http://localhost:3000/hello/world')
    expect(matchPageForUrl({ url: otherUrl, components: pages })).toEqual(
      pages[4],
    )
  })
  test('it prefers static path segments in urls', () => {
    const routes: PageRoute['path'][] = [
      [
        // /:other/:page
        { type: 'param', name: 'other', testValue: '' },
        { type: 'param', name: 'page', testValue: '' },
      ],
      [
        // /guides/:p1/:p2
        { type: 'static', name: 'guides' },
        { type: 'param', name: 'p1', testValue: '' },
        { type: 'param', name: 'p2', testValue: '' },
      ],
    ]

    const pages: ProjectFiles['components'] = Object.fromEntries(
      routes.map((path, i): [string, PageComponent] => [
        `${i}`,
        {
          name: `page-${i}`,
          attributes: {},
          variables: {},
          apis: {},
          nodes: {},
          route: { path, query: {} },
        },
      ]),
    )
    const guidesUrl = new URL('http://localhost:3000/guides/category/explore')
    expect(matchPageForUrl({ url: guidesUrl, components: pages })).toEqual(
      pages[1],
    )
    const guidesUrl2 = new URL('http://localhost:3000/guides')
    expect(matchPageForUrl({ url: guidesUrl2, components: pages })).toEqual(
      pages[1],
    )
    const guidesUrl3 = new URL('http://localhost:3000/test')
    expect(matchPageForUrl({ url: guidesUrl3, components: pages })).toEqual(
      pages[0],
    )
    const guidesUrl4 = new URL('http://localhost:3000/test/hello')
    expect(matchPageForUrl({ url: guidesUrl4, components: pages })).toEqual(
      pages[0],
    )
    const guidesUrl5 = new URL('http://localhost:3000/test/hello/world')
    expect(
      matchPageForUrl({ url: guidesUrl5, components: pages }),
    ).toBeUndefined()
  })
  test('it does not find a match for unknown paths', () => {
    const routes: PageRoute['path'][] = [
      // /search
      [{ type: 'static', name: 'search' }],
      [
        // /:other/page
        { type: 'param', name: 'other', testValue: '' },
        { type: 'static', name: 'page' },
      ],
    ]
    const pages: ProjectFiles['components'] = Object.fromEntries(
      routes.map((path, i): [string, PageComponent] => [
        `${i}`,
        {
          name: `page-${i}`,
          attributes: {},
          variables: {},
          apis: {},
          nodes: {},
          route: { path, query: {} },
        },
      ]),
    )
    const categoryUrl = new URL('http://localhost:3000/fruit')
    expect(
      matchPageForUrl({ url: categoryUrl, components: pages }),
    ).toBeUndefined()
    const docsUrl = new URL('http://localhost:3000/docs/intro/help')
    expect(matchPageForUrl({ url: docsUrl, components: pages })).toBeUndefined()
  })
})
