import type { ComponentData } from '../component/component.types'
import { toBoolean } from '../utils/util'
import {
  applyFormula,
  type AndOperation,
  type BaseFormulaContext,
} from './formula'

export const applyAndFormula = (
  formula: AndOperation,
  ctx: BaseFormulaContext,
  data: ComponentData,
) => {
  const args = formula.arguments ?? []
  if (ctx.reportFormulaEvaluation) {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (
        !toBoolean(
          applyFormula(arg?.formula, ctx, data, ['arguments', i, 'formula']),
        )
      ) {
        return false
      }
    }
  } else {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (!toBoolean(applyFormula(arg?.formula, ctx, data, undefined))) {
        return false
      }
    }
  }
  return true
}

export const applyEvaluateAllAndFormula = (
  formula: AndOperation,
  ctx: BaseFormulaContext,
  data: ComponentData,
) => {
  let andResult = true
  if (!formula.arguments || formula.arguments.length === 0) {
    return andResult
  }
  for (let i = 0; i < (formula.arguments ?? []).length; i++) {
    const arg = (formula.arguments ?? [])[i]
    if (
      !toBoolean(
        applyFormula(arg?.formula, ctx, data, ['arguments', i, 'formula']),
      )
    ) {
      andResult = false
    }
  }
  return andResult
}
