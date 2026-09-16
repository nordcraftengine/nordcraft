import type { ComponentData } from '../component/component.types'
import { toBoolean } from '../utils/util'
import { applyFormula, type FormulaContext, type OrOperation } from './formula'

export const applyOrFormula = (
  formula: OrOperation,
  ctx: FormulaContext,
  data: ComponentData,
  args: any,
  packageName: string | null | undefined,
  jsonPath: Array<string | number> | undefined,
) => {
  for (let i = 0; i < (formula.arguments ?? []).length; i++) {
    const arg = (formula.arguments ?? [])[i]
    if (
      toBoolean(
        applyFormula(arg?.formula, ctx, data, args, packageName, jsonPath, [
          'arguments',
          i,
          'formula',
        ]),
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
  data: ComponentData,
  args: any,
  packageName: string | null | undefined,
  jsonPath: Array<string | number> | undefined,
) => {
  let orResult = false
  for (let i = 0; i < (formula.arguments ?? []).length; i++) {
    const arg = (formula.arguments ?? [])[i]
    const argResult = applyFormula(
      arg?.formula,
      ctx,
      data,
      args,
      packageName,
      jsonPath,
      ['arguments', i, 'formula'],
    )
    if (toBoolean(argResult)) {
      orResult = true
    }
  }
  return orResult
}
