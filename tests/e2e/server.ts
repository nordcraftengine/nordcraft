/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'

const port = Number(process.env.PORT ?? 4173)
const repoRoot = path.resolve(import.meta.dir, '../..')
const runtimeDistDir = path.join(repoRoot, 'packages/runtime/dist')
const fixturesDir = path.join(import.meta.dir, 'fixtures')
const harnessDir = import.meta.dir

const API_RESPONSE_DELAY_MS = 750

const buildFixtures = async () => {
  const fixtureFiles = fs
    .readdirSync(fixturesDir)
    .filter((file) => file.endsWith('.fixture.ts'))

  const fixtures = new Map<string, string>()
  for (const file of fixtureFiles) {
    const result = await Bun.build({
      entrypoints: [path.join(fixturesDir, file)],
      format: 'esm',
      target: 'browser',
    })
    if (!result.success) {
      for (const log of result.logs) {
        console.error(log)
      }
      throw new Error(`Failed to build fixture ${file}`)
    }
    const output = result.outputs[0]
    if (!output) {
      throw new Error(`Fixture ${file} did not produce any output`)
    }
    fixtures.set(file.replace('.fixture.ts', ''), await output.text())
  }
  return fixtures
}

const fixtures = await buildFixtures()

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

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url)
    const pathname = url.pathname

    if (pathname === '/health') {
      return new Response('ok')
    }

    if (pathname === '/' || pathname === '/index.html') {
      return new Response(Bun.file(path.join(harnessDir, 'index.html')), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    if (pathname === '/harness.js') {
      return new Response(Bun.file(path.join(harnessDir, 'harness.js')), {
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
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

    if (pathname.startsWith('/fixtures/')) {
      const fixtureName = pathname
        .slice('/fixtures/'.length)
        .replace(/\.js$/, '')
      const fixture = fixtures.get(fixtureName)
      return fixture ? javascript(fixture) : notFound('Fixture not found')
    }

    if (pathname === '/api/files') {
      await Bun.sleep(
        Number(url.searchParams.get('delay') ?? API_RESPONSE_DELAY_MS),
      )
      return Response.json({
        items: ['file1.json', 'file2.json'],
      })
    }

    return notFound('Not found')
  },
})

console.log(`E2E server running at http://localhost:${server.port}`)
