# Nordcraft

Create highly performant web apps with SSR, branching, version control, components, and much more! Visit [nordcraft.com](https://nordcraft.com?utm_medium=web&utm_source=GitHub) to learn more.

[Discord](https://discord.com/invite/svBKYZf3UR) | [BlueSky](https://bsky.app/profile/nordcraft.com) | [YouTube](https://youtube.com/@nordcraftengine) | [LinkedIn](https://www.linkedin.com/company/nordcraft)

![Test status](https://github.com/nordcraftengine/nordcraft/actions/workflows/test.yml/badge.svg)
![Release status](https://github.com/nordcraftengine/nordcraft/actions/workflows/main.yml/badge.svg)

## Introduction

This repository holds different packages that are used internally by the Nordcraft framework. The packages that are currently available are:

- [core](https://www.npmjs.com/package/@nordcraft/core) 👈 holds core (shared) logic, data models, formula evaluation, and styling used by the other packages
- [runtime](https://www.npmjs.com/package/@nordcraft/runtime) 👈 includes logic for hydrating, running, and updating a Nordcraft application on the front-end
- [ssr](https://www.npmjs.com/package/@nordcraft/ssr) 👈 holds server-side rendering, HTML generation, and routing logic
- [lib](https://www.npmjs.com/package/@nordcraft/std-lib) 👈 holds all builtin [formulas](https://docs.nordcraft.com/formulas/overview#the-formula-editor) and [actions](https://docs.nordcraft.com/the-editor/data-panel#workflows) used by the runtime and during SSR
- [search](https://www.npmjs.com/package/@nordcraft/search) 👈 holds all issue rules, validators, and search functionality for traversing a Nordcraft project
- [schemas](https://www.npmjs.com/package/@nordcraft/schemas) 👈 holds validation schemas (powered by Valibot) for components, pages, workflows, and actions
- [css-parser](packages/css-parser) 👈 the CSS parser used in the Nordcraft editor to power the style panel
- [backend](packages/backend) 👈 full server runtime implementation using Hono, supporting Cloudflare Workers, Node.js, and Bun for serving and self-hosting Nordcraft applications
- [editor](packages/editor) 👈 shared editor interfaces, element definitions, and WebRef schemas

All published packages support clean ESM imports directly from their package roots and subpaths:

```ts
import { applyFormula } from '@nordcraft/core'
import { ComponentSchema } from '@nordcraft/schemas'
import { renderPageBody } from '@nordcraft/ssr'
import { actions, formulas } from '@nordcraft/std-lib'
import { findProblems } from '@nordcraft/search'
import { createRoot } from '@nordcraft/runtime'
```

## Requirements

Install using [bun](https://bun.sh/) by running `bun install`

### Commands

- Install dependencies: `bun install`
- Lint: `bun lint`
- Format code: `bun run prettier:write`
- Check types: `bun typecheck`
- Build: `bun run build` <-- builds all packages
- Run unit tests: `bun test`
- Run runtime benchmark: `bun run benchmark:runtime`
- Run runtime test-data impact benchmark: `bun run benchmark:runtime:compressed`
- Run SSR benchmark: `bun run benchmark:ssr:run`
- Run SSR test-data impact benchmark: `bun run benchmark:ssr:compressed`
- Run issues benchmark: `bun run benchmark:issues`
- Run benchmark unit tests: `bun run test:benchmarks`

### SSR performance in PRs

The SSR benchmark workflow runs on pull requests that change `packages/core/**`,
`packages/ssr/**`, the shared benchmark code, or the benchmark runner. It builds a
worktree for the PR base, runs persistent Bun workers for both revisions, and compares
interleaved samples using the same statistics and verdicts as the runtime benchmark.

- Workflow: `.github/workflows/ssr_benchmark.yml`
- Cases included:
  - `core.applyFormula (complex mix, 3k evals)`
  - `ssr.renderPageBody (collections hot path)`
  - `ssr.renderPageBody (example project HomePage)`
- Samples are reported as milliseconds per operation. `--repeat` controls how many
  case executions are included in each measured sample.
- Heap usage is reported alongside timing. The worker forces garbage collection before
  and after each sample and records the retained process heap delta per execution, so
  regressions and improvements are shown next to the timing verdict.
- Reports contain median/IQR values, a 95% bootstrap confidence interval, a Welch
  p-value, and a shared regression verdict.
- A regression is reported only when it is statistically significant and exceeds both
  the percentage and absolute thresholds.

To run the full comparison locally:

```sh
bun bin/runSsrBenchmarks.ts \
  --base-ref=origin/main \
  --runs=25 \
  --warmup=5 \
  --repeat=15 \
  --output-dir=/tmp/ssr-benchmark-data
```

The runner writes raw samples to `head/*.json` and `base/*.json`, plus
`ssr-benchmark-report.md` and `ssr-benchmark-report.json`. Use
`--export-markdown=...` and `--export-json=...` to choose the report paths. The
default comparison uses `--base-ref=origin/main`; pass `--base-ref=` with
`--skip-build=true` for a head-only run. Head-only results are labeled `A/A mode`
rather than byte-identical. Use `--keep-worktree=true` while debugging worktree setup.

Useful comparison options:

- `--runs=20` (measured samples per case; default)
- `--warmup=4` (warmup samples per case; default)
- `--repeat=1` (executions per measured sample; default)
- `--max-regression-percent=3.0 --max-regression-ms=1.0`
- `--noise-threshold-percent=1.5`
- `--fail-on-regression=false` (generate a report without failing the process)

### Test-data compression impact

Projects often carry editor-only test data (`testValue`, `testScenarios`, and
similar fields) that `removeTestData` strips before a project is shipped for
rendering. The fixture comparison mode runs the existing fixture-backed runtime
and SSR benchmark cases twice: once against the fixtures as they are stored and
once against fixtures sanitized in memory with `removeTestData`.

```sh
# SSR render and heap impact
bun run benchmark:ssr:compressed

# Browser runtime mount, interaction, and heap impact
bun run benchmark:runtime:compressed
```

The reports include a per-fixture payload comparison with raw/gzip sizes before
and after sanitation, so the serialization savings can be read next to the
timing and heap verdicts. Both modes ignore `--base-ref` because the comparison
is between fixture variants rather than code revisions.

## Status

While we consume all packages internally in the Nordcraft framework, this project is currently in development and is not yet ready for other applications to consume.

## Plan

As [announced in July '24](https://blog.nordcraft.com/nordcraft-is-soon-open-source), Nordcraft is in the process of going fully open source. The goal is to move more and more code into this repository and make it possible to self host a Nordcraft application.

We're currently working on moving more of the server-side rendering logic into this repository. This means that most updates are going to be in the ssr package for the time being.

## Dependencies

The dependencies between the packages are as follows:

- `core` is a dependency for all other packages
- `schemas` is a dependency for `search`
- `ssr` is a dependency for `search` and `backend`
- `std-lib` is a dependency for `runtime`, `ssr`, and `backend`
- `runtime` assets are synced and served by `backend`

## Releases

We use GitHub releases and release to npm atm, which is where we consume packages from internally.

To release a new version to npm:

1. Update the version in the root `package.json` file
2. Create a PR
3. Once the PR is merged, it will automatically release all packages to npm

## Contributing

If you find a bug or have an idea for a new feature, please open an issue. We also welcome pull requests. We are actively monitoring this repository.

If you have any questions, feel free to ask them in our [Discord](https://discord.com/invite/svBKYZf3UR) or reach out by [e-mail](mailto:hello@nordcraft.dev)

## Local development

To consume all packages locally, it's useful to run `bun run link` in the root of the repository. This will use `bun link` on all packages in the repository.

Other than that, the best way to test atm is to use the hono example.

## Documentation

The Nordcraft docs are open source.

If you'd like to contribute to the documentation, [view all open issues on GitHub](https://github.com/nordcraftengine/documentation/issues), or [open an issue](https://github.com/nordcraftengine/documentation/issues/new) if you find something wrong or missing.

[View the Nordcraft official documentation](https://docs.nordcraft.com).
