import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { cors } from 'hono/cors'

const app = new Hono({ strict: false })

app.use(
  cors({
    origin: '*',
    credentials: true,
  }),
)
// Serve static files from the dist directory
app.get('*', serveStatic({ root: '../dist/' }))
app.get('*', serveStatic({ root: '../packages/css-parser/dist/' }))

export default {
  port: 1337,
  fetch: app.fetch,
}
