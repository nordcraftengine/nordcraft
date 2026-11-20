import type { Component, PageComponent } from '@nordcraft/core'
import type {
  PageComponentsData,
  ProjectFilesWithCustomCode,
  Routes,
  ToddleProject,
} from '@nordcraft/ssr'
import { describe, expect, it } from 'bun:test'
import { getConnInfo } from 'hono/bun'
import { getApp } from '../app'
import { pageComponentsHandler } from './pageComponents'

const createPageComponent = (
  overrides?: Partial<PageComponent>,
): PageComponent => ({
  name: 'HomePage',
  page: 'HomePage',
  route: {
    path: [],
    query: {},
  },
  nodes: {
    root: {
      type: 'element',
      tag: 'div',
      children: ['child-comp'],
      attrs: {},
      style: { color: 'red' },
      events: {},
      classes: {},
    },
    'child-comp': {
      type: 'component',
      name: 'ChildButton',
      attrs: {},
      children: [],
      events: {},
    },
  },
  apis: {},
  variables: {},
  workflows: {},
  ...overrides,
})

const createChildComponent = (): Component => ({
  name: 'ChildButton',
  nodes: {
    root: {
      type: 'element',
      tag: 'button',
      children: [],
      attrs: {},
      style: { backgroundColor: 'blue' },
      events: {},
      classes: {},
    },
  },
  apis: {},
  variables: {},
  workflows: {},
})

const createProject = (): ToddleProject => ({
  id: 'proj-1',
  name: 'Test Project',
  short_id: 'test_project',
  type: 'app',
})

const createRoutes = (): Routes => ({
  pages: {
    HomePage: {
      name: 'HomePage',
      route: {
        path: [],
        query: {},
      },
    },
  },
  routes: {},
})

describe('pageComponentsHandler', () => {
  it('serves JSON with resolved component structures and 1-year immutable cache when ?v matches cacheBuster', async () => {
    const page = createPageComponent()
    const child = createChildComponent()
    const files: ProjectFilesWithCustomCode = {
      customCode: true,
      components: {
        HomePage: page,
        ChildButton: child,
      },
    }

    const app = getApp({
      getConnInfo,
      cacheBuster: 'commit-123',
      componentsRouter: {
        path: '/.toddle/components/:pageName{.+.json}',
        handler: pageComponentsHandler({
          pageLoader: ({ name }) => (name === 'HomePage' ? files : undefined),
          cacheBuster: 'commit-123',
        }),
      },
      fileLoaders: [
        async (c, next) => {
          c.set('routes', createRoutes())
          c.set('project', createProject())
          c.set('config', undefined)
          return next()
        },
      ],
      pageLoader: {
        loader: ({ name }) => (name === 'HomePage' ? files : undefined),
        urls: {
          pageStylesheetUrl: (name) => `/.toddle/stylesheet/${name}.css`,
          customCodeUrl: (name) => `/.toddle/custom-code/${name}.js`,
          pageComponentsUrl: (name) => `/.toddle/components/${name}.json`,
        },
      },
    })

    const res = await app.request(
      'http://localhost/.toddle/components/HomePage.json?v=commit-123',
    )
    const json = (await res.json()) as PageComponentsData

    const rootNode = json.component.nodes?.['root']
    const childRootNode = json.components[0]?.nodes?.['root']
    expect({
      status: res.status,
      contentType: res.headers.get('content-type'),
      cacheControl: res.headers.get('cache-control'),
      project: json.project,
      branch: json.branch,
      commit: json.commit,
      rootName: json.component.name,
      rootStyleCleared:
        rootNode?.type === 'element' ? rootNode.style : 'not-element',
      includedNames: json.components.map((c) => c.name),
      childStyleCleared:
        childRootNode?.type === 'element' ? childRootNode.style : 'not-element',
    }).toEqual({
      status: 200,
      contentType: 'application/json',
      cacheControl: 'public, max-age=31536000, immutable',
      project: 'test_project',
      branch: 'main',
      commit: 'unknown',
      rootName: 'HomePage',
      rootStyleCleared: undefined,
      includedNames: ['ChildButton'],
      childStyleCleared: undefined,
    })
  })

  it('serves no-cache when cacheBuster is omitted or ?v does not match', async () => {
    const page = createPageComponent({ nodes: {} })
    const files: ProjectFilesWithCustomCode = {
      customCode: false,
      components: {
        HomePage: page,
      },
    }

    const appWithoutCacheBuster = getApp({
      getConnInfo,
      componentsRouter: {
        path: '/.toddle/components/:pageName{.+.json}',
        handler: pageComponentsHandler({
          pageLoader: ({ name }) => (name === 'HomePage' ? files : undefined),
        }),
      },
      fileLoaders: [
        async (c, next) => {
          c.set('routes', createRoutes())
          c.set('project', createProject())
          c.set('config', undefined)
          return next()
        },
      ],
      pageLoader: {
        loader: ({ name }) => (name === 'HomePage' ? files : undefined),
        urls: {
          pageStylesheetUrl: (name) => `/.toddle/stylesheet/${name}.css`,
          customCodeUrl: (name) => `/.toddle/custom-code/${name}.js`,
          pageComponentsUrl: (name) => `/.toddle/components/${name}.json`,
        },
      },
    })

    const appWithCacheBuster = getApp({
      getConnInfo,
      cacheBuster: 'commit-123',
      componentsRouter: {
        path: '/.toddle/components/:pageName{.+.json}',
        handler: pageComponentsHandler({
          pageLoader: ({ name }) => (name === 'HomePage' ? files : undefined),
          cacheBuster: 'commit-123',
        }),
      },
      fileLoaders: [
        async (c, next) => {
          c.set('routes', createRoutes())
          c.set('project', createProject())
          c.set('config', undefined)
          return next()
        },
      ],
      pageLoader: {
        loader: ({ name }) => (name === 'HomePage' ? files : undefined),
        urls: {
          pageStylesheetUrl: (name) => `/.toddle/stylesheet/${name}.css`,
          customCodeUrl: (name) => `/.toddle/custom-code/${name}.js`,
          pageComponentsUrl: (name) => `/.toddle/components/${name}.json`,
        },
      },
    })

    const [noBusterRes, missingParamRes, staleParamRes] = await Promise.all([
      appWithoutCacheBuster.request(
        'http://localhost/.toddle/components/HomePage.json',
      ),
      appWithCacheBuster.request(
        'http://localhost/.toddle/components/HomePage.json',
      ),
      appWithCacheBuster.request(
        'http://localhost/.toddle/components/HomePage.json?v=old-commit',
      ),
    ])

    expect({
      noBusterStatus: noBusterRes.status,
      noBusterCacheControl: noBusterRes.headers.get('cache-control'),
      missingParamCacheControl: missingParamRes.headers.get('cache-control'),
      staleParamCacheControl: staleParamRes.headers.get('cache-control'),
    }).toEqual({
      noBusterStatus: 200,
      noBusterCacheControl: 'no-cache',
      missingParamCacheControl: 'no-cache',
      staleParamCacheControl: 'no-cache',
    })
  })

  it('returns 404 when page is missing or not a page component', async () => {
    const child = createChildComponent()
    const files: ProjectFilesWithCustomCode = {
      customCode: false,
      components: {
        ChildButton: child,
      },
    }

    const app = getApp({
      getConnInfo,
      componentsRouter: {
        path: '/.toddle/components/:pageName{.+.json}',
        handler: pageComponentsHandler({
          pageLoader: ({ name }) =>
            name === 'ChildButton' ? files : undefined,
        }),
      },
      fileLoaders: [
        async (c, next) => {
          c.set('routes', createRoutes())
          c.set('project', createProject())
          c.set('config', undefined)
          return next()
        },
      ],
      pageLoader: {
        loader: ({ name }) => (name === 'ChildButton' ? files : undefined),
        urls: {
          pageStylesheetUrl: (name) => `/.toddle/stylesheet/${name}.css`,
          customCodeUrl: (name) => `/.toddle/custom-code/${name}.js`,
          pageComponentsUrl: (name) => `/.toddle/components/${name}.json`,
        },
      },
    })

    const [missingRes, nonPageRes] = await Promise.all([
      app.request('http://localhost/.toddle/components/MissingPage.json'),
      app.request('http://localhost/.toddle/components/ChildButton.json'),
    ])

    expect({
      missingStatus: missingRes.status,
      nonPageStatus: nonPageRes.status,
    }).toEqual({
      missingStatus: 404,
      nonPageStatus: 404,
    })
  })
})
