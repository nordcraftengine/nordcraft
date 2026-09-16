import type { ComponentData } from '../component/component.types'
import { toBoolean } from '../utils/util'
import { applyFormula, type AndOperation, type FormulaContext } from './formula'

export const applyAndFormula = (
  formula: AndOperation,
  ctx: FormulaContext,
  data: ComponentData,
  args: any,
  packageName: string | null | undefined,
  jsonPath: Array<string | number> | undefined,
) => {
  for (let i = 0; i < (formula.arguments ?? []).length; i++) {
    const arg = (formula.arguments ?? [])[i]
    if (
      !toBoolean(
        applyFormula(arg?.formula, ctx, data, args, packageName, jsonPath, [
          'arguments',
          i,
          'formula',
        ]),
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
  data: ComponentData,
  args: any,
  packageName: string | null | undefined,
  jsonPath: Array<string | number> | undefined,
) => {
  let andResult = true
  if (!formula.arguments || formula.arguments.length === 0) {
    return andResult
  }
  for (let i = 0; i < (formula.arguments ?? []).length; i++) {
    const arg = (formula.arguments ?? [])[i]
    if (
      !toBoolean(
        applyFormula(arg?.formula, ctx, data, args, packageName, jsonPath, [
          'arguments',
          i,
          'formula',
        ]),
      )
    ) {
      andResult = false
    }
  }
  return andResult
}
