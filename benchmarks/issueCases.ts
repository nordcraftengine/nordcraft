import type {
  ComponentFormula,
  ComponentWorkflow,
  WorkflowActionModel,
} from '../packages/core/dist/component/component.types'
import type { Formula } from '../packages/core/dist/formula/formula'
import { fixProject } from '../packages/search/src/fixProject'
import { legacyFormulaRule } from '../packages/search/src/rules/issues/formulas/legacyFormulaRule'
import { namedComponentFormulaRule } from '../packages/search/src/rules/issues/formulas/namedComponentFormulaRule'
import { ISSUE_RULES } from '../packages/search/src/rules/issues/issueRules.index'
import { namedComponentWorkflowRule } from '../packages/search/src/rules/issues/workflows/namedComponentWorkflowRule'
import { searchProject } from '../packages/search/src/searchProject'
import type { ProjectFiles } from '../packages/ssr/dist/ssr.types'

export const ISSUE_BENCHMARK_CASES = [
  {
    id: 'autofix-named-formulas',
    name: 'issues.autofix (rename 50 named formulas in project)',
  },
  {
    id: 'autofix-named-workflows',
    name: 'issues.autofix (rename 50 named workflows in project)',
  },
  {
    id: 'autofix-legacy-formulas',
    name: 'issues.autofix (replace 50 legacy formulas in project)',
  },
  {
    id: 'search-project-issues',
    name: 'issues.search (all issue rules on benchmark project)',
  },
] as const

export type IssueBenchmarkCaseId = (typeof ISSUE_BENCHMARK_CASES)[number]['id']

export const isIssueBenchmarkCaseId = (
  value: string | undefined,
): value is IssueBenchmarkCaseId =>
  ISSUE_BENCHMARK_CASES.some((benchmarkCase) => benchmarkCase.id === value)

export const ISSUE_BENCHMARK_CASE_IDS = ISSUE_BENCHMARK_CASES.map(
  (benchmarkCase) => benchmarkCase.id,
)

export const issueBenchmarkUsage = () =>
  `--case=<${ISSUE_BENCHMARK_CASES.map(({ id }) => id).join('|')}>`

type BenchmarkRunner = () => Promise<void> | void

const loadProjectFixture = async (fileName: string) => {
  const fixtureUrl = new URL(
    `../benchmarks/browser/fixtures/${fileName}`,
    import.meta.url,
  )
  return (await Bun.file(fixtureUrl).json()) as { files: ProjectFiles }
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

export const createLegacyFormulasProject = (
  baseProject: ProjectFiles,
  count = 50,
): ProjectFiles => {
  const formulas: Record<string, ComponentFormula> = {}
  for (let i = 0; i < count; i++) {
    formulas[`legacy_${i}`] = {
      formula: {
        type: 'function',
        name: 'CONCAT',
        arguments: [
          {
            name: 'A',
            formula: { type: 'value', value: 'hello' },
          },
          {
            name: 'B',
            formula: { type: 'value', value: 'world' },
          },
        ],
      },
      arguments: [],
    }
  }

  return {
    ...baseProject,
    components: {
      ...baseProject.components,
      BenchmarkLegacy: {
        name: 'BenchmarkLegacy',
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
          },
        },
        formulas,
      },
    },
  }
}

export const createRunner = async (
  id: IssueBenchmarkCaseId,
): Promise<BenchmarkRunner> => {
  const fixture = await loadProjectFixture('benchmark-project.json')
  // Ensure contexts have formulas & workflows arrays so rules in base don't throw on undefined
  for (const comp of Object.values(fixture.files.components ?? {})) {
    for (const ctx of Object.values(comp.contexts ?? {})) {
      if (!ctx.workflows) ctx.workflows = []
      if (!ctx.formulas) ctx.formulas = []
    }
  }

  switch (id) {
    case 'autofix-named-formulas': {
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
      return () => {
        const files = createNamedWorkflowsProject(fixture.files, 50)
        fixProject({
          files,
          rule: namedComponentWorkflowRule,
          fixType: 'rename-named-component-workflow',
        })
      }
    }
    case 'autofix-legacy-formulas': {
      return () => {
        const files = createLegacyFormulasProject(fixture.files, 50)
        fixProject({
          files,
          rule: legacyFormulaRule,
          fixType: 'replace-legacy-formula',
        })
      }
    }
    case 'search-project-issues': {
      return () => {
        Array.from(
          searchProject({
            files: fixture.files,
            rules: ISSUE_RULES,
          }),
        )
      }
    }
  }
}
