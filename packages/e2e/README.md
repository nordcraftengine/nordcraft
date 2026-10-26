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

The test server loads each `fixtures/*.fixture.ts` project and serves the harness
HTML directly via the production `nordcraftPage` handler from `packages/backend`,
ensuring backend SSR and client-side runtime hydration remain aligned. A fixture
exports the name of its page, the components to mount, and optional custom actions:

```ts
export const page = 'MyPage'
export const components: Component[] = [/* ... */]
export const customActions: Record<string, PluginActionV2> = {/* ... */}
```

Open a fixture in a browser with `?fixture=<fixture-file-name>` (for example
`http://localhost:4173/?fixture=api-state`). The test helpers in `specs/`
handle this and wait for runtime hydration to complete.

Keep fixtures small and focused. Add new core runtime scenarios as separate
spec files rather than growing an existing one.
