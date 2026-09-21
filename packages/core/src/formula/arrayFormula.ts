/* eslint-disable max-params */
import type { ComponentData } from '../component/component.types'
import {
  applyFormula,
  type ArrayOperation,
  type FormulaContext,
} from './formula'

export const applyArrayFormula = (
  formula: ArrayOperation,
  ctx: FormulaContext,
  data?: ComponentData,
  path?: Array<string | number>,
) => {
  if (!formula.arguments || formula.arguments.length === 0) {
    return []
  }
  const result = new Array(formula.arguments.length)
  for (let i = 0; i < formula.arguments.length; i++) {
    const entry = formula.arguments[i]!
    result[i] = applyFormula(
      entry.formula,
      ctx,
      data,
      ctx.reportFormulaEvaluation
        ? path
          ? [...path, 'arguments', i, 'formula']
          : ['arguments', i, 'formula']
        : undefined,
    )
  }
  return result
}
