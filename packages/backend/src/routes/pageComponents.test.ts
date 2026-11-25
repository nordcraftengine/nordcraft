import { type Component, type PageComponent } from '@nordcraft/core'
import type {
  ProjectFilesWithCustomCode,
  Routes,
  ToddleProject,
} from '@nordcraft/ssr'
import { describe, expect, it } from 'bun:test'
import { getConnInfo } from 'hono/bun'
import { getApp } from '../app'
import { pageComponentsUrl } from './pageComponents'

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

describe('pageComponents', () => {
  it('builds encoded component module URLs', () => {
    expect({
      simple: pageComponentsUrl('HomePage'),
      withSpaces: pageComponentsUrl('My Page'),
    }).toEqual({
      simple: '/.nordcraft/components/HomePage.js',
      withSpaces: '/.nordcraft/components/My%20Page.js',
    })
  })

  it('serves immutable 1-year cached JS module when ?v matches cacheBuster and includes cacheBuster on customCodeUrl', async () => {
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
          pageStylesheetUrl: (name) => `/_static/${name}.css`,
          customCodeUrl: (name) => `/_static/cc_${name}.js`,
        },
      },
    })

    const res = await app.request(
      'http://localhost/.nordcraft/components/HomePage.js?v=commit-123',
    )
    const body = await res.text()

    expect({
      status: res.status,
      contentType: res.headers.get('content-type'),
      cacheControl: res.headers.get('cache-control'),
      importsRuntime: body.includes(
        "import { hydratePage } from '/_static/page.main.esm.js';",
      ),
      importsCustomCodeWithCacheBuster: body.includes(
        "import { loadCustomCode, formulas, actions } from '/_static/cc_HomePage.js?v=commit-123';",
      ),
      callsHydratePageWithCustomCode: body.includes(
        'hydratePage({\n  project: "test_project",\n  branch: "main",\n  commit: "unknown",\n  component,\n  components,\n  formulas,\n  actions,\n  loadCustomCode,\n});',
      ),
      containsChildComponent: body.includes('"name":"ChildButton"'),
      resolvesStylesOut: !body.includes('"color":"red"'),
    }).toEqual({
      status: 200,
      contentType: 'application/javascript',
      cacheControl: 'public, max-age=31536000, immutable',
      importsRuntime: true,
      importsCustomCodeWithCacheBuster: true,
      callsHydratePageWithCustomCode: true,
      containsChildComponent: true,
      resolvesStylesOut: true,
    })
  })

  it('serves no-cache when cacheBuster is omitted or ?v does not match, and omits custom code when customCode is false', async () => {
    const page = createPageComponent({ nodes: {} })
    const files: ProjectFilesWithCustomCode = {
      customCode: false,
      components: {
        HomePage: page,
      },
    }

    const appWithoutCacheBuster = getApp({
      getConnInfo,
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
          pageStylesheetUrl: (name) => `/_static/${name}.css`,
          customCodeUrl: (name) => `/_static/cc_${name}.js`,
        },
      },
    })

    const appWithCacheBuster = getApp({
      getConnInfo,
      cacheBuster: 'commit-123',
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
          pageStylesheetUrl: (name) => `/_static/${name}.css`,
          customCodeUrl: (name) => `/_static/cc_${name}.js`,
        },
      },
    })

    const [noBusterRes, missingParamRes, staleParamRes] = await Promise.all([
      appWithoutCacheBuster.request(
        'http://localhost/.nordcraft/components/HomePage.js',
      ),
      appWithCacheBuster.request(
        'http://localhost/.nordcraft/components/HomePage.js',
      ),
      appWithCacheBuster.request(
        'http://localhost/.nordcraft/components/HomePage.js?v=old-commit',
      ),
    ])
    const body = await noBusterRes.text()

    expect({
      noBusterStatus: noBusterRes.status,
      noBusterCacheControl: noBusterRes.headers.get('cache-control'),
      missingParamCacheControl: missingParamRes.headers.get('cache-control'),
      staleParamCacheControl: staleParamRes.headers.get('cache-control'),
      callsHydratePageWithoutCustomCode: body.includes(
        'hydratePage({\n  project: "test_project",\n  branch: "main",\n  commit: "unknown",\n  component,\n  components,\n});',
      ),
      hasLoadCustomCode: body.includes('loadCustomCode'),
    }).toEqual({
      noBusterStatus: 200,
      noBusterCacheControl: 'no-cache',
      missingParamCacheControl: 'no-cache',
      staleParamCacheControl: 'no-cache',
      callsHydratePageWithoutCustomCode: true,
      hasLoadCustomCode: false,
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
          pageStylesheetUrl: (name) => `/_static/${name}.css`,
          customCodeUrl: (name) => `/_static/cc_${name}.js`,
        },
      },
    })

    const [missingRes, nonPageRes] = await Promise.all([
      app.request('http://localhost/.nordcraft/components/MissingPage.js'),
      app.request('http://localhost/.nordcraft/components/ChildButton.js'),
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
