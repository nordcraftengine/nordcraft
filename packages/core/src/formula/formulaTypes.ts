import type { Nullable } from '../types'
import type { Formula } from './formula'

export interface BaseFormula {
  name: string
  description?: Nullable<string>
  arguments: Array<{
    name: string
    formula?: Nullable<Formula>
    testValue?: Nullable<unknown>
  }>
  // exported indicates that a formula is exported in a package
  exported?: Nullable<boolean>
  variableArguments?: Nullable<boolean>
}

export interface ToddleFormula extends BaseFormula {
  formula: Formula
}

/**
 * The Handler generic is a string server side, but a function client side
 */
export interface CodeFormula<Handler = string | Function> extends BaseFormula {
  version?: Nullable<2 | never>
  handler: Handler
}

export type PluginFormula<Handler = string | Function> =
  | ToddleFormula
  | CodeFormula<Handler>

export interface GlobalFormulas<Handler = string | Function> {
  formulas?: Nullable<Record<string, PluginFormula<Handler>>>
  packages?: Nullable<
    Partial<
      Record<string, { formulas?: Record<string, PluginFormula<Handler>> }>
    >
  >
}
