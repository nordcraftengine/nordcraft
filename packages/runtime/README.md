# @nordcraft/runtime

[npm](https://www.npmjs.com/package/@nordcraft/runtime)

The runtime powers the client-side of a [Nordcraft](https://nordcraft.com) application. It is responsible for rendering the application, handling events, and managing the state.

## Bundle analysis

The runtime ships [esbuild](https://esbuild.github.io/)-bundled entry points. To see what contributes to their size, run the analysis script from `packages/runtime`:

```sh
bun run analyze                # page.main
bun run analyze custom-element.main
bun run analyze dist/page.main.esm.js
bun run analyze page.main --verbose
```

Any bundle name, esbuild output file or source entry point can be passed to the script. Use `--verbose` for a per-file breakdown.
