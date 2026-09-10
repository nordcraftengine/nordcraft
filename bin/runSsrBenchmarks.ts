import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

type CaseConfig = {
  id: 'formula' | 'collections-hot-path' | 'example-project-homepage'
  name: string
}

const BENCHMARK_CASES: CaseConfig[] = [
  {
    id: 'formula',
    name: 'core.applyFormula (complex mix, 3k evals)',
  },
  {
    id: 'collections-hot-path',
    name: 'ssr.renderPageBody (collections hot path)',
  },
  {
    id: 'example-project-homepage',
    name: 'ssr.renderPageBody (example project HomePage)',
  },
]

const args = new Map(
  Bun.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=')
    return [key, value]
  }),
)

const runs = Number(args.get('--runs') ?? 50)
const warmup = Number(args.get('--warmup') ?? 5)
const repeat = Number(args.get('--repeat') ?? 3)
const baseRef = args.get('--base-ref')
const skipBuild = (args.get('--skip-build') ?? 'false') === 'true'
const outputDirArg = args.get('--output-dir')
const keepWorktree = (args.get('--keep-worktree') ?? 'false') === 'true'
const maxRegressionPercent = Number(args.get('--max-regression-percent') ?? 5)
const maxRegressionMs = Number(args.get('--max-regression-ms') ?? 1.0)
const failOnRegression = (args.get('--fail-on-regression') ?? 'true') === 'true'

if (baseRef && skipBuild) {
  throw new Error(
    '--skip-build=true is not supported together with --base-ref. The base worktree needs dependencies and compiled dist files. Remove --skip-build or run without --base-ref.',
  )
}

if (!Number.isInteger(repeat) || repeat < 1) {
  throw new Error('--repeat must be a positive integer')
}

const runCommand = (
  cmd: string[],
  options?: {
    cwd?: string
  },
) => {
  const process = Bun.spawnSync(cmd, {
    cwd: options?.cwd,
    stdout: 'inherit',
    stderr: 'inherit',
  })
  if (process.exitCode !== 0) {
    throw new Error(`Command failed (${process.exitCode}): ${cmd.join(' ')}`)
  }
}

const writeSection = (title: string) => {
  console.log(`\n== ${title} ==`)
}

const ensureTooling = () => {
  const check = Bun.spawnSync(['hyperfine', '--version'], {
    stdout: 'inherit',
    stderr: 'inherit',
  })
  if (check.exitCode !== 0) {
    throw new Error(
      'hyperfine was not found on PATH. Install it first: https://github.com/sharkdp/hyperfine#installation',
    )
  }
}

const runBenchmarks = (targetDir: string, outputDir: string) => {
  mkdirSync(outputDir, { recursive: true })
  for (const benchmarkCase of BENCHMARK_CASES) {
    writeSection(`Benchmark: ${benchmarkCase.name}`)
    runCommand(
      [
        'hyperfine',
        '--warmup',
        String(warmup),
        '--runs',
        String(runs),
        '--export-json',
        `${outputDir}/${benchmarkCase.id}.json`,
        `bun bin/ssrBenchmark.ts --case=${benchmarkCase.id} --repeat=${repeat}`,
      ],
      { cwd: targetDir },
    )
  }
}

const tempRoot = outputDirArg
  ? outputDirArg
  : await mkdtemp(join(tmpdir(), 'nordcraft-ssr-bench-'))

const headOutputDir = `${tempRoot}/head`
const baseOutputDir = `${tempRoot}/base`

ensureTooling()

writeSection('Benchmarking current checkout')
if (!skipBuild) {
  runCommand(['bun', 'run', 'build'])
}
runBenchmarks(process.cwd(), headOutputDir)

if (!baseRef) {
  writeSection('Done')
  console.log(`Head benchmark outputs: ${headOutputDir}`)
  process.exit(0)
}

const baseWorktree = `${tempRoot}/base-worktree`
let shouldCleanupWorktree = true

try {
  writeSection(`Preparing base worktree (${baseRef})`)
  runCommand(['git', 'worktree', 'add', baseWorktree, baseRef])

  mkdirSync(`${baseWorktree}/bin`, { recursive: true })
  cpSync('bin/ssrBenchmark.ts', `${baseWorktree}/bin/ssrBenchmark.ts`)

  if (!skipBuild) {
    runCommand(['bun', 'install', '--frozen-lockfile'], { cwd: baseWorktree })
    runCommand(['bun', 'run', 'build'], { cwd: baseWorktree })
  }

  writeSection(`Benchmarking base ref (${baseRef})`)
  runBenchmarks(baseWorktree, baseOutputDir)

  writeSection('Comparing head vs base')
  runCommand([
    'bun',
    'bin/compareBenchmarks.ts',
    `--base-dir=${baseOutputDir}`,
    `--head-dir=${headOutputDir}`,
    `--max-regression-percent=${maxRegressionPercent}`,
    `--max-regression-ms=${maxRegressionMs}`,
    `--fail-on-regression=${failOnRegression}`,
  ])

  console.log(`\nHead benchmark outputs: ${headOutputDir}`)
  console.log(`Base benchmark outputs: ${baseOutputDir}`)
  console.log(`Base worktree: ${baseWorktree}`)
  if (keepWorktree) {
    shouldCleanupWorktree = false
  }
} finally {
  if (shouldCleanupWorktree) {
    Bun.spawnSync(['git', 'worktree', 'remove', baseWorktree, '--force'], {
      stdout: 'inherit',
      stderr: 'inherit',
    })
  }
  if (!keepWorktree) {
    rmSync(baseWorktree, { recursive: true, force: true })
  }
}
