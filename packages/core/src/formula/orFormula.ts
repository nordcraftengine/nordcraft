import '../compileTime'
import type { ComponentData } from '../component/component.types'
import { toBoolean } from '../utils/util'
import {
  applyFormula,
  type BaseFormulaContext,
  type OrOperation,
} from './formula'

export const applyOrFormula = (
  formula: OrOperation,
  ctx: BaseFormulaContext,
  data: ComponentData,
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
          IS_PREVIEW && ctx.reportFormulaEvaluation
            ? ['arguments', i, 'formula']
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
  ctx: BaseFormulaContext,
  data: ComponentData,
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
