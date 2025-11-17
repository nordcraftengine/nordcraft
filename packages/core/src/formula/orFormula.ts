import { toBoolean } from '../utils/util'
import { applyFormula, type FormulaContext, type OrOperation } from './formula'

export const applyOrFormula = (formula: OrOperation, ctx: FormulaContext) => {
  for (let i = 0; i < formula.arguments.length; i++) {
    const arg = formula.arguments[i]
    if (toBoolean(applyFormula(arg?.formula, ctx, ['arguments', i]))) {
      return true
    }
  }
  return false
}

export const applyEvaluateAllOrFormula = (
  formula: OrOperation,
  ctx: FormulaContext,
) => {
  let orResult = false
  for (let i = 0; i < formula.arguments.length; i++) {
    const arg = formula.arguments[i]
    const argResult = applyFormula(arg?.formula, ctx, [
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
