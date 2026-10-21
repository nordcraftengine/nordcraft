import type { ComponentData } from '../component/component.types'
import { toBoolean } from '../utils/util'
import { applyFormula, type FormulaContext, type OrOperation } from './formula'

export const applyOrFormula = (
  formula: OrOperation,
  ctx: FormulaContext,
  data: ComponentData | undefined,
) => {
  const args = formula.arguments ?? []
  if (ctx.reportFormulaEvaluation) {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (
        toBoolean(
          applyFormula(arg?.formula, ctx, data, ['arguments', i, 'formula']),
        )
      ) {
        return true
      }
    }
  } else {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (toBoolean(applyFormula(arg?.formula, ctx, data))) {
        return true
      }
    }
  }
  return false
}

export const applyEvaluateAllOrFormula = (
  formula: OrOperation,
  ctx: FormulaContext,
  data: ComponentData | undefined,
) => {
  let orResult = false
  for (let i = 0; i < (formula.arguments ?? []).length; i++) {
    const arg = (formula.arguments ?? [])[i]
    const argResult = applyFormula(arg?.formula, ctx, data, [
      'arguments',
      i,
      'formula',
    ])
    if (toBoolean(argResult)) {
      orResult = true
    }
  }
  return orResult
}
