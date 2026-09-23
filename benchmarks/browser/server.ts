/* eslint-disable no-console */
import path from 'path'

export interface BenchmarkServerOptions {
  port?: number
  baseDistDir: string
  headDistDir: string
}

export function startBenchmarkServer(options: BenchmarkServerOptions) {
  const browserDir = path.resolve(import.meta.dir)

  const server = Bun.serve({
    port: options.port ?? 0, // 0 selects random available port
    async fetch(req) {
      const url = new URL(req.url)
      const pathname = url.pathname

      if (pathname === '/' || pathname === '/harness.html') {
        const file = Bun.file(path.join(browserDir, 'harness.html'))
        return new Response(file, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }

      if (pathname === '/harness.js') {
        const file = Bun.file(path.join(browserDir, 'harness.js'))
        return new Response(file, {
          headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
        })
      }

      if (pathname.startsWith('/fixtures/')) {
        const relative = pathname.replace('/fixtures/', '')
        const targetPath = path.join(browserDir, 'fixtures', relative)
        const file = Bun.file(targetPath)
        if (await file.exists()) {
          return new Response(file, {
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          })
        }
        return new Response(`Fixture not found: ${relative}`, { status: 404 })
      }

      if (pathname.startsWith('/bundle/base/')) {
        const relative = pathname.replace('/bundle/base/', '')
        const targetPath = path.join(options.baseDistDir, relative)
        const file = Bun.file(targetPath)
        if (await file.exists()) {
          return new Response(file, {
            headers: {
              'Content-Type': 'application/javascript; charset=utf-8',
              'Cache-Control': 'no-store',
            },
          })
        }
        return new Response(`Base bundle not found: ${relative}`, {
          status: 404,
        })
      }

      if (pathname.startsWith('/bundle/head/')) {
        const relative = pathname.replace('/bundle/head/', '')
        const targetPath = path.join(options.headDistDir, relative)
        const file = Bun.file(targetPath)
        if (await file.exists()) {
          return new Response(file, {
            headers: {
              'Content-Type': 'application/javascript; charset=utf-8',
              'Cache-Control': 'no-store',
            },
          })
        }
        return new Response(`Head bundle not found: ${relative}`, {
          status: 404,
        })
      }

      return new Response('Not Found', { status: 404 })
    },
  })

  return server
}

if (import.meta.main) {
  const server = startBenchmarkServer({
    port: 3333,
    baseDistDir: path.resolve('packages/runtime/dist'),
    headDistDir: path.resolve('packages/runtime/dist'),
  })
  console.log(`Benchmark server running at http://localhost:${server.port}`)
}
