/* eslint-disable no-console */
import { nordcraftPage } from '@nordcraft/backend/routes/nordcraftPage'
import { pageStateHandler } from '@nordcraft/backend/routes/pageState'
import { initIsEqual } from '@nordcraft/ssr/dist/rendering/equals'
import { Hono } from 'hono'
import { timing } from 'hono/timing'
import path from 'node:path'
import { API_RESPONSE_DELAY_MS, API_RESPONSE_ITEMS } from './fixtures/constants'
import { createCustomCode, loadFixtures } from './fixtures/loader'

initIsEqual()

const port = Number(process.env.PORT ?? 4173)
const repoRoot = path.resolve(import.meta.dir, '../..')
const runtimeDistDir = path.join(repoRoot, 'packages/runtime/dist')

const fixtures = await loadFixtures(path.join(import.meta.dir, 'fixtures'))

const javascript = (body: string) =>
  new Response(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })

const notFound = (message: string) => new Response(message, { status: 404 })

const resolveInside = (baseDir: string, requestPath: string) => {
  const resolvedPath = path.resolve(baseDir, requestPath)
  return resolvedPath.startsWith(`${baseDir}${path.sep}`) ? resolvedPath : null
}

const app = new Hono()
app.use('*', timing())

app.get('/health', (c) => c.text('ok'))

// Page state handler from backend package
app.get('/.nordcraft/page-state/:renderId{.+}', pageStateHandler as any)

// Custom code handler to support fixtures with custom actions / formulas
app.get('/_custom_code/:fixture', (c) => {
  const rawParam = c.req.param('fixture')
  const fixtureName = rawParam.endsWith('.js')
    ? rawParam.slice(0, -3)
    : rawParam

  const fixture = fixtureName ? fixtures.get(fixtureName) : undefined
  return c.text(createCustomCode(fixture), 200, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'no-store',
  })
})

// Main entrypoint: generates the harness HTML via nordcraftPage from backend package
app.get('/', async (c) => {
  const fixtureName = c.req.query('fixture')
  if (!fixtureName) {
    return c.text('Missing fixture query parameter', 400)
  }

  const fixture = fixtureName ? fixtures.get(fixtureName) : undefined
  if (!fixture) {
    return c.text(`Fixture "${fixtureName}" not found`, 404)
  }

  const page = fixture.components.find((comp) => comp.name === fixture.page)
  if (!page) {
    return c.text(`Page "${fixture.page}" not found in fixture`, 404)
  }

  const usesCustomCode = Boolean(
    fixture.customActions && Object.keys(fixture.customActions).length > 0,
  )

  return await nordcraftPage({
    hono: c as any,
    project: {
      name: 'E2E Tests',
      short_id: 'e2e',
      id: 'e2e',
      type: 'app',
    },
    files: {
      components: Object.fromEntries(
        fixture.components.map((comp) => [comp.name, comp]),
      ),
      customCode: usesCustomCode,
    } as any,
    page: page as any,
    status: 200,
    options: {
      pageStylesheetUrl: (name) => `/_static/${name}.css`,
      customCodeUrl: () => `/_custom_code/${fixtureName}.js`,
    },
  })
})

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url)
    const pathname = url.pathname

    // Static runtime bundle requested by the nordcraftPage template (/_static/page.main.esm.js)
    if (
      pathname === '/_static/page.main.esm.js' ||
      pathname === '/runtime/page.main.esm.js'
    ) {
      const file = Bun.file(path.join(runtimeDistDir, 'page.main.esm.js'))
      if (!(await file.exists())) {
        return notFound('Runtime bundle not found. Run "bun run build" first.')
      }
      return javascript(await file.text())
    }

    if (pathname.startsWith('/runtime/')) {
      const filePath = resolveInside(
        runtimeDistDir,
        pathname.slice('/runtime/'.length),
      )
      if (!filePath) {
        return notFound('Invalid runtime path')
      }
      const file = Bun.file(filePath)
      if (!(await file.exists())) {
        return notFound(`Runtime file not found: ${pathname}`)
      }
      return javascript(await file.text())
    }

    if (pathname.endsWith('.css')) {
      return new Response('', { headers: { 'Content-Type': 'text/css' } })
    }

    if (pathname === '/api/files') {
      await Bun.sleep(
        Number(url.searchParams.get('delay') ?? API_RESPONSE_DELAY_MS),
      )
      return Response.json({
        items: API_RESPONSE_ITEMS,
      })
    }

    // Let Hono handle routing for nordcraftPage, page-state, and custom code
    return app.fetch(request)
  },
})

console.log(`E2E server running at http://localhost:${server.port}`)
