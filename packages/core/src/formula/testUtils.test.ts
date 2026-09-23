import type { FormulaContext } from './formula'
import type { FormulaEvaluationReporter } from './formulaTypes'

// Register all core formulas globally for tests
if (!(globalThis as any).__CORE_FORMULAS__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const libFormulas = require('../../../lib/dist/formulas')
  ;(globalThis as any).__CORE_FORMULAS__ = Object.fromEntries(
    Object.entries(libFormulas).map(([name, module]) => [
      '@toddle/' + name,
      ((module as any).default ?? module) as any,
    ]),
  )
}

// Helper to create a minimal context
export const createTestFormulaContext = (data: any = {}): FormulaContext => {
  const coreFormulas = (globalThis as any).__CORE_FORMULAS__ as
    | Record<string, any>
    | undefined
  return {
    component: undefined,
    formulaCache: {},
    data,
    root: {} as Document,
    package: undefined,
    toddle: {
      getFormula: (name: string) => coreFormulas?.[name],
      getCustomFormula: () => undefined,
      errors: [],
    },
    env: {
      logErrors: true,
      runtime: 'page',
      branchName: 'main',
      isServer: false,
      request: undefined,
    },
    reportFormulaEvaluation: undefined,
    jsonPath: [],
  }
}

// Helper to create a minimal context when evaluating all paths
export const createTestFormulaContextForAllPaths = (
  data: any = {},
  formulaEvaluationReporter: FormulaEvaluationReporter,
): FormulaContext => ({
  component: undefined,
  formulaCache: {},
  data,
  root: undefined,
  package: undefined,
  toddle: {
    getFormula: (name: string) => coreFormulas[name],
    getCustomFormula: () => undefined,
    errors: [],
  },
  env: {
    logErrors: true,
    runtime: 'page',
    branchName: 'main',
    isServer: false,
    request: undefined,
  },
  jsonPath: [],
  reportFormulaEvaluation: formulaEvaluationReporter,
})
