import type { FormulaContext } from './formula'
import { FormulaEvaluationReporter } from './formulaTypes'

const coreFormulas = (globalThis as any).__CORE_FORMULAS__ as Record<
  string,
  any
>

// Helper to create a minimal context
export const createTestFormulaContext = (data: any = {}): FormulaContext => {
  return {
    component: undefined,
    formulaCache: {},
    data,
    root: {} as Document,
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
