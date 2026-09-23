import { toBoolean } from '../utils/util'
import { applyFormula, type AndOperation, type FormulaContext } from './formula'

export const applyAndFormula = (formula: AndOperation, ctx: FormulaContext) => {
  for (let i = 0; i < (formula.arguments ?? []).length; i++) {
    const arg = (formula.arguments ?? [])[i]
    if (
      !toBoolean(applyFormula(arg?.formula, ctx, ['arguments', i, 'formula']))
    ) {
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
  if (!formula.arguments || formula.arguments.length === 0) {
    return andResult
  }
  for (let i = 0; i < (formula.arguments ?? []).length; i++) {
    const arg = (formula.arguments ?? [])[i]
    if (
      !toBoolean(applyFormula(arg?.formula, ctx, ['arguments', i, 'formula']))
    ) {
      andResult = false
    }
  }
  return andResult
}
