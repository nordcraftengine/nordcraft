# @nordcraft/runtime

[npm](https://www.npmjs.com/package/@nordcraft/runtime)

The runtime powers the client-side of a [Nordcraft](https://nordcraft.com) application. It is responsible for rendering the application, handling events, and managing the state.

## Bundle analysis

The runtime ships [esbuild](https://esbuild.github.io/)-bundled entry points. To see what contributes to their size, run the analysis script from `packages/runtime`:

```sh
bun run analyze                # page.main (opens browser GUI)
bun run analyze custom-element.main
bun run analyze dist/page.main.esm.js
bun run analyze --cli          # terminal output only
bun run analyze --cli --verbose
```

Any bundle name, esbuild output file or source entry point can be passed to the script. By default, an interactive visualization (Treemap, Sunburst, Flamegraph) powered by esbuild's bundle analyzer is served and opened in your browser. Use `--cli` to output only to the terminal, and `--verbose` for a per-file breakdown.

> **Note:** Sibling packages must be built beforehand (e.g. via `bun run build` at the repository root) so that workspace dependencies such as `@nordcraft/core` can be resolved.
