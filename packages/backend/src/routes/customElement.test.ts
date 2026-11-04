import type { Component, Theme } from '@nordcraft/core'
import type { ProjectFilesWithCustomCode, ToddleProject } from '@nordcraft/ssr'
import { describe, expect, test } from 'bun:test'
import { Window } from 'happy-dom'
import { Hono } from 'hono'
import type { HonoEnv, HonoProject } from '../../hono'
import { customElement } from './customElement'

const createTestComponent = (name = 'my-widget'): Component => ({
  name,
  nodes: {
    root: {
      type: 'element',
      tag: 'div',
      attrs: {},
      style: {},
      events: {},
      classes: {},
      children: [],
    },
  },
})

const createTestThemes = (fonts: Theme['fonts']): Record<string, Theme> => ({
  Default: {
    fonts,
  },
})

const createCustomElementApp = (themes: Record<string, Theme>) => {
  const component = createTestComponent()
  const files: ProjectFilesWithCustomCode = {
    customCode: false,
    components: {
      [component.name]: component,
    },
    themes,
  }
  const project: ToddleProject = {
    name: 'toddle',
    description: '',
    short_id: 'toddle',
    id: 'proj-1',
    type: 'app',
  }

  const app = new Hono<
    HonoEnv<
      HonoProject & {
        files: ProjectFilesWithCustomCode
        component: Component
      }
    >
  >()
  app.use('*', async (c, next) => {
    c.set('project', project)
    c.set('config', undefined)
    await next()
  })
  app.get(
    '/.toddle/custom-element/:filename{.+.js}',
    customElement(() => files),
  )
  return app
}

const runGeneratedCustomElementScript = (
  scriptContent: string,
  win: Window,
) => {
  const executableBody = scriptContent.replace(
    /^import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?/gm,
    '',
  )
  const fn = new Function(
    'document',
    'window',
    'globalThis',
    'customElements',
    'defineComponents',
    'loadCorePlugins',
    executableBody,
  )
  fn(
    win.document,
    win,
    win,
    win.customElements,
    () => {},
    () => {},
  )
}

describe('customElement font loading', () => {
  test('does not re-inject font stylesheet when all custom-element fonts are already linked on the host page', async () => {
    const app = createCustomElementApp(
      createTestThemes([
        {
          name: 'inter',
          family: 'Inter',
          provider: 'google',
          type: 'sans-serif',
          variants: [
            {
              name: 'regular',
              weight: '400',
              italic: false,
              url: 'https://fonts.gstatic.com/s/inter/v20/inter-400.woff2',
            },
          ],
        },
        {
          name: 'intertight',
          family: 'Inter Tight',
          provider: 'google',
          type: 'sans-serif',
          variants: [
            {
              name: '600',
              weight: '600',
              italic: false,
              url: 'https://fonts.gstatic.com/s/intertight/v9/intertight-600.woff2',
            },
          ],
        },
      ]),
    )

    const res = await app.request(
      'https://toddle.toddle.site/.toddle/custom-element/my-widget.js',
    )
    const scriptContent = await res.text()

    const win = new Window({ url: 'https://nordcraft.com/' })
    win.document.head.innerHTML =
      '<link href="/.toddle/fonts/stylesheet/css2?display=block&family=Inter%3Awght%40400&family=Inter+Tight%3Awght%40600" rel="stylesheet" />'

    runGeneratedCustomElementScript(scriptContent, win)

    const links = Array.from(
      win.document.head.querySelectorAll('link[rel="stylesheet"]'),
    ).map((link) => link.getAttribute('href'))

    expect(links).toEqual([
      '/.toddle/fonts/stylesheet/css2?display=block&family=Inter%3Awght%40400&family=Inter+Tight%3Awght%40600',
    ])
  })

  test('filters out font families already linked on the host page and prepends only missing fonts to head', async () => {
    const app = createCustomElementApp(
      createTestThemes([
        {
          name: 'inter',
          family: 'Inter',
          provider: 'google',
          type: 'sans-serif',
          variants: [
            {
              name: 'regular',
              weight: '400',
              italic: false,
              url: 'https://fonts.gstatic.com/s/inter/v20/inter-400.woff2',
            },
          ],
        },
        {
          name: 'rocksalt',
          family: 'Rock Salt',
          provider: 'google',
          type: 'cursive',
          variants: [
            {
              name: 'regular',
              weight: '400',
              italic: false,
              url: 'https://fonts.gstatic.com/s/rocksalt/v24/rocksalt-400.woff2',
            },
          ],
        },
      ]),
    )

    const res = await app.request(
      'https://toddle.toddle.site/.toddle/custom-element/my-widget.js',
    )
    const scriptContent = await res.text()

    const win = new Window({ url: 'https://nordcraft.com/' })
    win.document.head.innerHTML =
      '<link href="/.toddle/fonts/stylesheet/css2?display=block&family=Inter%3Awght%40400" rel="stylesheet" />'

    runGeneratedCustomElementScript(scriptContent, win)

    const links = Array.from(
      win.document.head.querySelectorAll('link[rel="stylesheet"]'),
    ).map((link) => link.getAttribute('href'))

    expect(links).toEqual([
      'https://toddle.toddle.site/.toddle/fonts/stylesheet/css2?display=block&family=Rock+Salt%3Awght%40400',
      '/.toddle/fonts/stylesheet/css2?display=block&family=Inter%3Awght%40400',
    ])
  })

  test('filters out font faces already present in document.fonts and requests only missing weights', async () => {
    const app = createCustomElementApp(
      createTestThemes([
        {
          name: 'intertight',
          family: 'Inter Tight',
          provider: 'google',
          type: 'sans-serif',
          variants: [
            {
              name: 'regular',
              weight: '400',
              italic: false,
              url: 'https://fonts.gstatic.com/s/intertight/v9/intertight-400.woff2',
            },
            {
              name: '600',
              weight: '600',
              italic: false,
              url: 'https://fonts.gstatic.com/s/intertight/v9/intertight-600.woff2',
            },
          ],
        },
        {
          name: 'rocksalt',
          family: 'Rock Salt',
          provider: 'google',
          type: 'cursive',
          variants: [
            {
              name: 'regular',
              weight: '400',
              italic: false,
              url: 'https://fonts.gstatic.com/s/rocksalt/v24/rocksalt-400.woff2',
            },
          ],
        },
      ]),
    )

    const res = await app.request(
      'https://toddle.toddle.site/.toddle/custom-element/my-widget.js',
    )
    const scriptContent = await res.text()

    const win = new Window({ url: 'https://nordcraft.com/' })
    Object.defineProperty(win.document, 'fonts', {
      value: [
        { family: '"Inter Tight"', style: 'normal', weight: '400' },
        { family: 'Rock Salt', style: 'normal', weight: '400' },
      ],
      configurable: true,
    })

    runGeneratedCustomElementScript(scriptContent, win)

    const links = Array.from(
      win.document.head.querySelectorAll('link[rel="stylesheet"]'),
    ).map((link) => link.getAttribute('href'))

    expect(links).toEqual([
      'https://toddle.toddle.site/.toddle/fonts/stylesheet/css2?display=block&family=Inter+Tight%3Awght%40600',
    ])
  })
})
