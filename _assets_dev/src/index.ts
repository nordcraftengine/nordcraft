import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'

const app = new Hono({ strict: false })

// Serve static files from the dist directory
app.get('*', serveStatic({ root: '../dist/' }))

export default {
  port: 1337,
  fetch: app.fetch,
}
