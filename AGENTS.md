# Repository Guidelines

Nordcraft is a high-performance visual development engine monorepo powered by Bun.

## Monorepo Architecture

- **`packages/core` (`@nordcraft/core`)**: Core domain models, AST types, AST manipulation utilities, and base formula/action definitions.
- **`packages/schemas` (`@nordcraft/schemas`)**: Valibot validation schemas for Nordcraft models (components, pages, formulas, actions, etc.).
- **`packages/runtime` (`@nordcraft/runtime`)**: Reactive client runtime, signals, custom element integration, hydration, and editor preview canvas.
- **`packages/ssr` (`@nordcraft/ssr`)**: Server-side rendering engine.
- **`packages/lib` (`@nordcraft/std-lib`)**: Standard library formulas and actions.
- **`packages/backend`**: Server adapter for Node.js, Bun, and Cloudflare Workers.
- **`packages/css-parser`**: CSS tokenization, parsing, AST transformation, and serialization.
- **`packages/search`**: Search indexing and query evaluation.
- **`packages/editor`**: Element definitions, WebRef IDL interfaces, and CSS keyword metadata.
- **`packages/e2e`**: End-to-end integration and fixture tests.

> **Important**: Workspace packages depend on built output (`dist/`). If you modify `@nordcraft/core` or `@nordcraft/schemas`, run `bun run build` before running tests or typechecks in dependent packages.

---

## Development Workflow & Commands

Use **Bun** (`bun`) for all tasks; do not use `npm`, `yarn`, or `pnpm`.

- **Build all packages**: `bun run build`
- **Run tests**:
  - All tests: `bun test`
  - Specific package: `cd packages/<name> && bun test` or `bun test packages/<name>`
  - Single file: `bun test path/to/file.test.ts`
- **Typecheck**: `bun run typecheck`
- **Lint**: `bun run lint`
- **Format**: `bun run prettier` (check) or `bun run prettier:write` (fix)

---

## Testing

While tests are great, they should never impact how the actual code is written. Avoid dependency injection, but prefer stubbing external dependencies and using mocks where necessary.

- Never alter production code signatures, return types, or architecture solely to accommodate tests (e.g., adding return/cleanup values, exposing private state, adding test hooks, or using dependency injection). Production code must reflect runtime requirements only.
- Tests must adapt to the production code, not vice versa. Handle test isolation and cleanup entirely within test files (e.g., stubbing globals/modules, using `beforeEach`/`afterEach`).
- Use Bun's native test runner (`import { describe, expect, test, beforeEach, afterEach, mock } from 'bun:test'`).

### Test-Driven Development (TDD)

ALWAYS use TDD. Write all the tests for a task BEFORE starting any implementation work.

1. Read and understand the task requirements.
2. Write the complete test suite that defines the expected behavior.
3. Run the tests and confirm they fail (red).
4. Implement the minimum code to make the tests pass (green).
5. Refactor while keeping tests green.

Do not begin implementation until the tests are written and reviewed.

### Unit Tests Must Compare Against Full Expected Values

Unit tests MUST assert equality against the full, complete expected value in a **single assertion**. Never use partial matchers or drill down into individual sub-properties:

- ❌ `toMatchObject` — ignores missing and extra properties
- ❌ `toBeDefined` / `toBeUndefined` — only checks existence and hides missing or corrupted data
- ❌ `toBeTruthy` / `toBeFalsy` — only checks truthiness
- ❌ `toContain` / `toHaveLength` for objects — partial assertions
- ❌ `expect.any(...)` — erases actual value comparison
- ❌ Drilling into nested properties (`expect(btnNode.events?.click).toBeDefined()`) instead of asserting the complete object structure
- ❌ Multiple fragmented assertions across sub-properties instead of one single comprehensive `.toEqual(...)` assertion

Instead use strict, complete assertions:

- ✅ `toEqual` — deep equality for objects/arrays asserting the ENTIRE structure in one assert (use `satisfies` to guarantee type correctness of the expected value)
- ✅ `toBe` — for primitives and references

### Rules for Output Verification

1. **One Assertion on Complete Output**: When verifying the result of a transformation or patch (such as `patch(ast, diff)`), evaluate the entire output structure (e.g. `expect(result.nodes).toEqual({ ... } satisfies ComponentAST['nodes'])` or `expect(result).toEqual({ ... })`) in a **single** assertion.
2. **Never check existence to test additions or deletions**: If an event, attribute, or property is added or removed, assert the complete parent object showing the exact updated contents or the complete absence of that key. Never use `toBeDefined()` or `toBeUndefined()`.
3. **Do not change test inputs**: When updating or rewriting tests, never change the inputs (AST, diff strings, arguments).

### Good unit test

```ts
test('patch updates existing event handler with complete expected AST', async () => {
  const { ast: result } = await patch(ast, diff)

  expect(result.nodes).toEqual({
    btn: {
      type: 'element',
      tag: 'button',
      children: [],
      attrs: {},
      style: {},
      events: {
        click: {
          trigger: 'click',
          actions: [
            {
              type: 'TriggerEvent',
              event: 'newClick',
              data: {
                formula: {
                  type: 'path',
                  path: ['Attributes', 'value'],
                },
              },
            },
          ],
        },
      },
      classes: {},
    },
  } satisfies ComponentAST['nodes'])
})
```

### Bad unit test

```ts
test('patch updates existing event handler', async () => {
  const { ast: result } = await patch(ast, diff)
  const btnNode = result.nodes?.btn as any

  // BAD: Partial checks, existence checks, drilling into sub-properties
  expect(btnNode.events?.click).toBeDefined()
  expect(btnNode.events?.click?.trigger).toBe('click')
  expect(btnNode.events?.click?.actions).toBeDefined()
})
```

The bad test passes even if `actions` are empty, corrupted, wrong type, or if other node properties were accidentally deleted. The good test fails on any deviation from the expected output.

---

## Code & TypeScript Conventions

### TypeScript Rules
- **No `any`**: Never use `any` type annotations or `as any` casts.
- **No double casting**: Never use `as unknown as ...` (or similar double assertions) to bypass the type checker.
- **Model types properly**: Use precise types, discriminated unions, generics, type guards, and domain models from `@nordcraft/core` or schemas from `@nordcraft/schemas`.
- **Type-only imports**: Always use `import type { ... }` when importing types (enforced by `verbatimModuleSyntax` and ESLint).
- **Type inference**: Avoid explicit return types when TypeScript can reliably infer them.
- **Avoid proxy types**: Prefer using canonical domain types directly rather than creating unnecessary wrapper or proxy types.

### Code Style & Lint Conventions
- **Maximum parameters**: `max-params: 3`. If a function needs more than 3 arguments, group them into an options object.
- **Console usage**: Never use `console.log`. Use `console.info`, `console.warn`, or `console.error` if logging is required.
- **Switch statements**: Must be exhaustive (`@typescript-eslint/switch-exhaustiveness-check`).
- **Promises**: Strict floating promise check is active. Always `await` or properly handle returned promises.
- **Utility functions**: Always look for and reuse existing helpers in `@nordcraft/core` before writing new utility functions.
- **Performance vs. Readability**:
  - Hot execution paths (reactive signals, DOM patching, hydration, SSR rendering loops, formula evaluation) must prioritize **runtime performance** and minimal memory allocations.
  - Non-critical paths should prioritize clarity and readability.
- **Runtime Bundle Budget**: `packages/runtime` outputs client bundles with strict size caps tested in CI (`page.main.esm.js` <= 105KB, `custom-element.main.esm.js` <= 120KB). Avoid introducing heavy external dependencies or bulky data tables to client runtime bundles.

---

## Git & PR Guidelines

- **Never push changes to a remote branch** unless explicitly instructed to do so.
- When creating or updating a pull request, provide a clear and concise description of the changes made without unnecessary formatting headers or conversational filler.
