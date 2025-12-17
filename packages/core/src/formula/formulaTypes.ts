import type { Formula } from './formula'

export interface BaseFormula {
  name: string
  description?: string
  arguments: Array<{
    name: string
    formula?: Formula | null
    testValue?: unknown
  }>
  // exported indicates that a formula is exported in a package
  exported?: boolean
  variableArguments?: boolean | null
}

export interface ToddleFormula extends BaseFormula {
  formula: Formula
}

/**
 * The Handler generic is a string server side, but a function client side
 */
export interface CodeFormula<Handler = string | Function> extends BaseFormula {
  version?: 2 | never
  handler: Handler
}

export type PluginFormula<Handler = string | Function> =
  | ToddleFormula
  | CodeFormula<Handler>

export interface GlobalFormulas<Handler = string | Function> {
  formulas?: Record<string, PluginFormula<Handler>>
  packages?: Partial<
    Record<string, { formulas?: Record<string, PluginFormula<Handler>> }>
  >
}

export type FormulaEvaluationReporter = (
  path: Array<string | number>,
  result: any,
) => void
