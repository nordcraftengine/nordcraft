/* eslint-disable max-params */
import type { ComponentData } from '../component/component.types'
import { toBoolean } from '../utils/util'
import { applyFormula, type AndOperation, type FormulaContext } from './formula'

export const applyAndFormula = (
  formula: AndOperation,
  ctx: FormulaContext,
  data?: ComponentData,
  path?: Array<string | number>,
) => {
  const args = formula.arguments ?? []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (
      !toBoolean(
        applyFormula(
          arg?.formula,
          ctx,
          data,
          ctx.reportFormulaEvaluation
            ? path
              ? [...path, 'arguments', i, 'formula']
              : ['arguments', i, 'formula']
            : undefined,
        ),
      )
    ) {
      return false
    }
  }
  return true
}

export const applyEvaluateAllAndFormula = (
  formula: AndOperation,
  ctx: FormulaContext,
  data?: ComponentData,
  path?: Array<string | number>,
) => {
  let andResult = true
  const args = formula.arguments ?? []
  if (args.length === 0) {
    return andResult
  }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (
      !toBoolean(
        applyFormula(
          arg?.formula,
          ctx,
          data,
          ctx.reportFormulaEvaluation
            ? path
              ? [...path, 'arguments', i, 'formula']
              : ['arguments', i, 'formula']
            : undefined,
        ),
      )
    ) {
      andResult = false
    }
  }
  return andResult
}
