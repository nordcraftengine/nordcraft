/* eslint-disable max-params */
import type { ComponentData } from '../component/component.types'
import { toBoolean } from '../utils/util'
import { applyFormula, type FormulaContext, type OrOperation } from './formula'

export const applyOrFormula = (
  formula: OrOperation,
  ctx: FormulaContext,
  data?: ComponentData,
  path?: Array<string | number>,
) => {
  const args = formula.arguments ?? []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (
      toBoolean(
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
      return true
    }
  }
  return false
}

export const applyEvaluateAllOrFormula = (
  formula: OrOperation,
  ctx: FormulaContext,
  data?: ComponentData,
  path?: Array<string | number>,
) => {
  let orResult = false
  const args = formula.arguments ?? []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const argResult = applyFormula(
      arg?.formula,
      ctx,
      data,
      ctx.reportFormulaEvaluation
        ? path
          ? [...path, 'arguments', i, 'formula']
          : ['arguments', i, 'formula']
        : undefined,
    )
    if (toBoolean(argResult)) {
      orResult = true
    }
  }
  return orResult
}
