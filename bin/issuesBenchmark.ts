/* eslint-disable no-console */
import { createInterface } from 'node:readline'

import {
  getBoolean,
  getNonNegativeInteger,
  getOptionalString,
  getPositiveInteger,
  parseBenchmarkArgs,
} from '../benchmarks/cli'
import {
  isIssueBenchmarkCaseId,
  issueBenchmarkUsage,
  type IssueBenchmarkCaseId,
} from '../benchmarks/issueCases'
import { median } from '../benchmarks/stats'
import type {
  ComponentFormula,
  ComponentWorkflow,
  WorkflowActionModel,
} from '../packages/core/dist/component/component.types'
import type { Formula } from '../packages/core/dist/formula/formula'
import { fixProject } from '../packages/search/src/fixProject'
import { namedComponentFormulaRule } from '../packages/search/src/rules/issues/formulas/namedComponentFormulaRule'
import { ISSUE_RULES } from '../packages/search/src/rules/issues/issueRules.index'
import { namedComponentWorkflowRule } from '../packages/search/src/rules/issues/workflows/namedComponentWorkflowRule'
import { searchProject } from '../packages/search/src/searchProject'
import type { ProjectFiles } from '../packages/ssr/dist/ssr.types'

type BenchmarkRunner = () => Promise<void> | void

type WorkerRequest = { type: 'close' } | { type: 'run'; count?: number }

type WorkerResponse = { timeMs: number } | { error: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isWorkerRequest = (value: unknown): value is WorkerRequest => {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false
  }
  if (value.type === 'close') {
    return !('count' in value)
  }
  return (
    value.type === 'run' &&
    (value.count === undefined ||
      (typeof value.count === 'number' &&
        Number.isInteger(value.count) &&
        value.count >= 1))
  )
}

type IssuesArgs = {
  caseId?: IssueBenchmarkCaseId
  repeat: number
  isWorker: boolean
  runs: number
  warmup: number
  outputPath?: string
  json: boolean
  profile: boolean
}

export const parseIssuesArgs = (
  argv: readonly string[] = Bun.argv.slice(2),
): IssuesArgs => {
  const args = parseBenchmarkArgs(argv)
  const isProfile = getBoolean(args, '--profile', false)
  const caseIdRaw = args.get('--case')
  const caseId = isIssueBenchmarkCaseId(caseIdRaw) ? caseIdRaw : undefined

  if (!isProfile && !caseId && !getBoolean(args, '--worker', false)) {
    throw new Error(
      `Usage: bun bin/issuesBenchmark.ts ${issueBenchmarkUsage()} (or --profile)`,
    )
  }

  return {
    caseId,
    repeat: getPositiveInteger(args, '--repeat', 1),
    isWorker: getBoolean(args, '--worker', false),
    runs: getPositiveInteger(args, '--runs', 1),
    warmup: getNonNegativeInteger(args, '--warmup', 0),
    outputPath: getOptionalString(args, '--output'),
    json: getBoolean(args, '--json', false),
    profile: isProfile,
  }
}

const loadProjectFixture = async (fileName: string) => {
  const fixtureUrl = new URL(
    `../benchmarks/browser/fixtures/${fileName}`,
    import.meta.url,
  )
  const fixture = (await Bun.file(fixtureUrl).json()) as { files: ProjectFiles }
  // Ensure contexts have formulas & workflows arrays so rules in base don't throw on undefined
  for (const comp of Object.values(fixture.files.components ?? {})) {
    if (!comp) {
      continue
    }
    for (const ctx of Object.values(comp.contexts ?? {})) {
      if (!ctx.workflows) {
        ctx.workflows = []
      }
      if (!ctx.formulas) {
        ctx.formulas = []
      }
    }
  }
  return fixture
}

export const createNamedFormulasProject = (
  baseProject: ProjectFiles,
  count = 50,
): ProjectFiles => {
  const formulas: Record<string, ComponentFormula> = {}
  const textAttrs: Record<string, Formula> = {}
  const consumerFormulas: string[] = []
  const consumerAttrs: Record<string, Formula> = {}

  for (let i = 0; i < count; i++) {
    const key = `formula_${i}`
    const newName = `renamed_formula_${i}`
    formulas[key] = {
      name: newName,
      formula: { type: 'value', value: i },
      arguments: [],
    }
    textAttrs[`ref_${i}`] = {
      type: 'apply',
      name: key,
      arguments: [],
    }
    consumerFormulas.push(key)
    consumerAttrs[`ref_${i}`] = {
      type: 'path',
      path: ['Contexts', 'BenchmarkProvider', key],
    }
  }

  return {
    ...baseProject,
    components: {
      ...baseProject.components,
      BenchmarkProvider: {
        name: 'BenchmarkProvider',
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
            attrs: textAttrs,
          },
        },
        formulas,
      },
      BenchmarkConsumer: {
        name: 'BenchmarkConsumer',
        contexts: {
          BenchmarkProvider: {
            formulas: consumerFormulas,
            workflows: [],
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'span',
            attrs: consumerAttrs,
          },
        },
      },
    },
  }
}

export const createNamedWorkflowsProject = (
  baseProject: ProjectFiles,
  count = 50,
): ProjectFiles => {
  const workflows: Record<string, ComponentWorkflow> = {}
  const internalActions: WorkflowActionModel[] = []
  const consumerWorkflows: string[] = []
  const consumerActions: WorkflowActionModel[] = []

  for (let i = 0; i < count; i++) {
    const key = `wf_${i}`
    const newName = `renamed_wf_${i}`
    workflows[key] = {
      name: newName,
      actions: [
        {
          type: 'TriggerWorkflow',
          workflow: key,
        },
      ],
      parameters: [],
    }
    internalActions.push({
      type: 'TriggerWorkflow',
      workflow: key,
    })
    consumerWorkflows.push(key)
    consumerActions.push({
      type: 'TriggerWorkflow',
      contextProvider: 'BenchmarkProvider',
      workflow: key,
    })
  }

  return {
    ...baseProject,
    components: {
      ...baseProject.components,
      BenchmarkProvider: {
        name: 'BenchmarkProvider',
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
            events: {
              click: {
                trigger: 'click',
                actions: internalActions,
              },
            },
          },
        },
        workflows,
      },
      BenchmarkConsumer: {
        name: 'BenchmarkConsumer',
        contexts: {
          BenchmarkProvider: {
            formulas: [],
            workflows: consumerWorkflows,
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'span',
            events: {
              click: {
                trigger: 'click',
                actions: consumerActions,
              },
            },
          },
        },
      },
    },
  }
}

export const createRunner = async (
  id: IssueBenchmarkCaseId,
): Promise<BenchmarkRunner> => {
  switch (id) {
    case 'search-nordcraft-all-rules': {
      const fixture = await loadProjectFixture('nordcraft.com.json')
      return () => {
        Array.from(
          searchProject({
            files: fixture.files,
            rules: ISSUE_RULES,
          }),
        )
      }
    }
    case 'autofix-nordcraft-named-formulas': {
      const fixture = await loadProjectFixture('nordcraft.com.json')
      return () => {
        fixProject({
          files: structuredClone(fixture.files),
          rule: namedComponentFormulaRule,
          fixType: 'rename-named-component-formula',
        })
      }
    }
    case 'autofix-nordcraft-named-workflows': {
      const fixture = await loadProjectFixture('nordcraft.com.json')
      return () => {
        fixProject({
          files: structuredClone(fixture.files),
          rule: namedComponentWorkflowRule,
          fixType: 'rename-named-component-workflow',
        })
      }
    }
    case 'autofix-named-formulas': {
      const fixture = await loadProjectFixture('benchmark-project.json')
      return () => {
        const files = createNamedFormulasProject(fixture.files, 50)
        fixProject({
          files,
          rule: namedComponentFormulaRule,
          fixType: 'rename-named-component-formula',
        })
      }
    }
    case 'autofix-named-workflows': {
      const fixture = await loadProjectFixture('benchmark-project.json')
      return () => {
        const files = createNamedWorkflowsProject(fixture.files, 50)
        fixProject({
          files,
          rule: namedComponentWorkflowRule,
          fixType: 'rename-named-component-workflow',
        })
      }
    }
  }
}

const collectGarbage = () => {
  if (typeof Bun !== 'undefined' && typeof Bun.gc === 'function') {
    Bun.gc(true)
  }
}

const measure = async (runner: BenchmarkRunner, repeat: number, count = 1) => {
  collectGarbage()
  const start = performance.now()
  for (let i = 0; i < count * repeat; i++) {
    await runner()
  }
  return (performance.now() - start) / (count * repeat)
}

const writeWorkerResponse = (response: WorkerResponse) => {
  process.stdout.write(`${JSON.stringify(response)}\n`)
}

const runWorker = async (runner: BenchmarkRunner, repeat: number) => {
  const input = createInterface({ input: process.stdin })

  for await (const line of input) {
    if (!line.trim()) {
      continue
    }

    let request: unknown
    try {
      request = JSON.parse(line) as unknown
    } catch (error) {
      writeWorkerResponse({
        error: error instanceof Error ? error.message : String(error),
      })
      continue
    }

    if (!isWorkerRequest(request)) {
      writeWorkerResponse({ error: 'Invalid worker request' })
      continue
    }

    if (request.type === 'close') {
      break
    }

    if (request.type !== 'run') {
      writeWorkerResponse({ error: `Unknown worker command: ${request.type}` })
      continue
    }

    try {
      const count = request.count ?? 1
      if (!Number.isInteger(count) || count < 1) {
        throw new Error('Worker run count must be a positive integer')
      }
      writeWorkerResponse({ timeMs: await measure(runner, repeat, count) })
    } catch (error) {
      writeWorkerResponse({
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

const runDirect = async (runner: BenchmarkRunner, options: IssuesArgs) => {
  for (let i = 0; i < options.warmup; i++) {
    await measure(runner, options.repeat)
  }

  const timesMs: number[] = []
  for (let i = 0; i < options.runs; i++) {
    timesMs.push(await measure(runner, options.repeat))
  }

  const medianTime = median(timesMs)
  if (options.outputPath) {
    await Bun.write(
      options.outputPath,
      JSON.stringify(
        {
          caseId: options.caseId,
          repeat: options.repeat,
          medianTimeMs: medianTime,
          timesMs,
        },
        null,
        2,
      ),
    )
  }

  if (options.json) {
    console.log(
      JSON.stringify({
        caseId: options.caseId,
        repeat: options.repeat,
        medianTimeMs: medianTime,
        timesMs,
      }),
    )
  } else {
    console.log(
      `[${options.caseId}] median: ${medianTime.toFixed(2)} ms (${timesMs.length} samples)`,
    )
  }
}

export type RuleProfileResult = {
  code: string
  category: string
  durationMs: number
  percentOfTotal: number
  issuesFound: number
}

export type ProfileReport = {
  totalDurationMs: number
  rules: RuleProfileResult[]
}

export const profileRules = async (): Promise<ProfileReport> => {
  const fixture = await loadProjectFixture('nordcraft.com.json')
  const timings: Array<{
    code: string
    category: string
    durationMs: number
    issuesFound: number
  }> = []

  // Warmup run
  Array.from(
    searchProject({ files: fixture.files, rules: ISSUE_RULES.slice(0, 2) }),
  )

  for (const rule of ISSUE_RULES) {
    collectGarbage()
    const start = performance.now()
    const results = Array.from(
      searchProject({ files: fixture.files, rules: [rule] }),
    )
    const durationMs = performance.now() - start
    timings.push({
      code: rule.code,
      category: rule.category ?? 'Uncategorized',
      durationMs,
      issuesFound: results.length,
    })
  }

  timings.sort((a, b) => b.durationMs - a.durationMs)
  const totalDurationMs = timings.reduce((acc, t) => acc + t.durationMs, 0)

  return {
    totalDurationMs,
    rules: timings.map((t) => ({
      ...t,
      percentOfTotal: (t.durationMs / totalDurationMs) * 100,
    })),
  }
}

export const runProfile = async (json = false) => {
  console.log(
    'Profiling individual issue rules on real-world nordcraft.com fixture...',
  )
  const report = await profileRules()

  if (json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  const rows = report.rules.map((t) => {
    return `| ${t.code} | ${t.category} | ${t.durationMs.toFixed(2)} ms | ${t.percentOfTotal.toFixed(1)}% | ${t.issuesFound} |`
  })

  const markdown = [
    '',
    `## ⏱️ Issue Rules Profile (Real-world nordcraft.com, Total: ${report.totalDurationMs.toFixed(2)} ms)`,
    '',
    '| Rule Code | Category | Time (ms) | % of Total | Issues Found |',
    '|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n')

  console.log(markdown)
}

async function main() {
  const options = parseIssuesArgs()
  if (options.profile) {
    await runProfile(options.json)
    return
  }

  if (!options.caseId) {
    throw new Error('Missing benchmark case id')
  }

  const runner = await createRunner(options.caseId)
  if (options.isWorker) {
    await runWorker(runner, options.repeat)
  } else {
    await runDirect(runner, options)
  }
}

if (import.meta.main) {
  await main()
}
