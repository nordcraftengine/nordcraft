# Nordcraft

Create highly performant web apps with SSR, branching, version control, components, and much more! Visit [nordcraft.com](https://nordcraft.com?utm_medium=web&utm_source=GitHub) to learn more.

[Discord](https://discord.com/invite/svBKYZf3UR) | [BlueSky](https://bsky.app/profile/nordcraft.com) | [YouTube](https://youtube.com/@nordcraftengine) | [LinkedIn](https://www.linkedin.com/company/nordcraft)

![Test status](https://github.com/nordcraftengine/nordcraft/actions/workflows/test.yml/badge.svg)
![Release status](https://github.com/nordcraftengine/nordcraft/actions/workflows/main.yml/badge.svg)

## Introduction

This repository holds different packages that are used internally by the Nordcraft framework. The packages that are currently available are:

- [core](https://www.npmjs.com/package/@nordcraft/core) 👈 holds core (shared) logic used by the other packages
- [runtime](https://www.npmjs.com/package/@nordcraft/runtime) 👈 includes logic for hydrating/running/updating a Nordcraft application on the front-end
- [ssr](https://www.npmjs.com/package/@nordcraft/ssr) 👈 holds part of the server-side rendering logic
- [lib](https://www.npmjs.com/package/@nordcraft/std-lib) 👈 holds all builtin [formulas](https://docs.nordcraft.com/formulas/overview#the-formula-editor) and [actions](https://docs.nordcraft.com/the-editor/data-panel#workflows) used by the runtime and during ssr
- [search](https://www.npmjs.com/package/@nordcraft/search) 👈 holds all issue rules and search functionality for traversing a Nordcraft project. This powers the issue panel in the Nordcraft editor in a web worker atm
- [css-parser] the CSS parser used in the Nordcraft editor to power the style panel

## Requirements

Install using [bun](https://bun.sh/) by running `bun install`

### Commands

- Install: `bun install`
- Lint: `bun lint`
- Check types: `bun typecheck`
- Build: `bun run build` <-- builds all packages
- Benchmark SSR: `bun run benchmark:ssr`
- Compare two benchmark runs: `bun run benchmark:ssr:compare --base=/tmp/base.json --head=/tmp/head.json`
- Run full local benchmark suite: `bun run benchmark:ssr:run`

### SSR performance in PRs

We run an SSR benchmark workflow on pull requests and compare median render times between the PR branch and the PR base commit.

Benchmark timing/stats are measured by `hyperfine` and exported as one JSON file per case for both base and head.
Each benchmark process also executes the selected case multiple times (`--repeat`) to make each run more stable.

- Workflow: `.github/workflows/ssr_benchmark.yml`
- Cases included:
  - `core.applyFormula (complex mix, 3k evals)`
  - `ssr.renderPageBody (collections hot path)`
  - `ssr.renderPageBody (example project HomePage)`
- Default regression threshold: `5%` and `1.0 ms` on median `ms/op`
  - A benchmark only fails when both thresholds are exceeded, which reduces false positives on tiny absolute regressions.

To run locally and compare two branches manually:

1. Generate a baseline file:
   - `bun run build`
   - `bun run benchmark:ssr --output=/tmp/ssr-base.json`
2. Switch branch/commit and generate a head file:
   - `bun run build`
   - `bun run benchmark:ssr --output=/tmp/ssr-head.json`
3. Compare:
   - `bun run benchmark:ssr:compare --base-dir=/tmp/ssr-base --head-dir=/tmp/ssr-head --max-regression-percent=5 --max-regression-ms=1.0`

To generate local hyperfine outputs manually:

- `mkdir -p /tmp/ssr-head /tmp/ssr-base`
- `hyperfine --warmup 3 --runs 30 --export-json /tmp/ssr-head/formula.json 'bun bin/ssrBenchmark.ts --case=formula'`
- `hyperfine --warmup 3 --runs 30 --export-json /tmp/ssr-head/collections-hot-path.json 'bun bin/ssrBenchmark.ts --case=collections-hot-path'`
- `hyperfine --warmup 3 --runs 30 --export-json /tmp/ssr-head/example-project-homepage.json 'bun bin/ssrBenchmark.ts --case=example-project-homepage'`

To run everything (and compare against `main`) with one command:

- `bun run benchmark:ssr:run --base-ref=origin/main`
- CI uses the same benchmark intensity as this command with explicit defaults: `--runs=40 --warmup=5 --repeat=15`.

Useful options:

- `--runs=50` (hyperfine runs per case)
- `--warmup=5` (hyperfine warmup runs)
- `--repeat=3` (number of case executions per hyperfine run)
- `--output-dir=/tmp/my-ssr-bench` (persist outputs in a custom folder)
- `--skip-build=true` (skip build/install if already prepared)
  - Note: `--skip-build=true` only works when running head-only (without `--base-ref`).
- `--max-regression-percent=5 --max-regression-ms=1.0` (comparison thresholds)

## Status

While we consume all packages internally in the Nordcraft framework, this project is currently in development and is not yet ready for other applications to consume.

## Plan

As [announced in July '24](https://blog.nordcraft.com/nordcraft-is-soon-open-source), Nordcraft is in the process of going fully open source. The goal is to move more and more code into this repository and make it possible to self host a Nordcraft application.

We're currently working on moving more of the server-side rendering logic into this repository. This means that most updates are going to be in the ssr package for the time being.

## Dependencies

The dependencies between the packages are as follows:

- `core` is a dependency for all other packages
- `ssr` is a dependency for `search`
- `std-lib` is a dependency for `runtime` and `ssr`

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
