/* eslint-disable max-params */
import type { ComponentData } from '../component/component.types'
import {
  applyFormula,
  type FormulaContext,
  type ObjectOperation,
} from './formula'

export const applyObjectFormula = (
  formula: ObjectOperation,
  ctx: FormulaContext,
  data?: ComponentData,
  path?: Array<string | number>,
) => {
  const result: Record<string, any> = {}
  if (!formula.arguments) {
    return result
  }
  for (let i = 0; i < formula.arguments.length; i++) {
    const entry = formula.arguments[i]
    if (entry?.name) {
      result[entry.name] = applyFormula(
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
  }
  return result
}
