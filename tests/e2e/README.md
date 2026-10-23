# Runtime E2E tests

Browser tests for core runtime behaviour, using Playwright and the production
runtime bundle.

## Running locally

```sh
bun install
bun run build
bunx playwright install chromium
bun run test:e2e
```

The test server builds each `fixtures/*.fixture.ts` project on startup and
serves it together with `packages/runtime/dist/page.main.esm.js`. A fixture
exports the name of its page and the components to mount:

```ts
export const page = 'MyPage'
export const components: Component[] = [/* ... */]
```

Open a fixture in a browser with `?fixture=<fixture-file-name>` (for example
`http://localhost:4173/?fixture=api-state`). The test helpers in `specs/`
handle this and surface fixture boot errors as test failures.

Keep fixtures small and focused. Add new core runtime scenarios as separate
spec files rather than growing an existing one.
