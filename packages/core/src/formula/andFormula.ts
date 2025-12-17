import { toBoolean } from '../utils/util'
import { applyFormula, type AndOperation, type FormulaContext } from './formula'

export const applyAndFormula = (formula: AndOperation, ctx: FormulaContext) => {
  for (let i = 0; i < formula.arguments.length; i++) {
    const arg = formula.arguments[i]
    if (!toBoolean(applyFormula(arg?.formula, ctx, ['arguments', i]))) {
      return false
    }
  }
  return true
}

export const applyEvaluateAllAndFormula = (
  formula: AndOperation,
  ctx: FormulaContext,
) => {
  let andResult = true
  for (let i = 0; i < formula.arguments.length; i++) {
    const arg = formula.arguments[i]
    if (!toBoolean(applyFormula(arg?.formula, ctx, ['arguments', i]))) {
      andResult = false
    }
  }
  return andResult
}
