import type { ComponentData } from '../component/component.types'
import {
  applyFormula,
  type ArrayOperation,
  type FormulaContext,
} from './formula'

export const applyArrayFormula = (
  formula: ArrayOperation,
  ctx: FormulaContext,
  data: ComponentData,
) => {
  const args = formula.arguments ?? []
  const len = args.length
  const result = new Array(len)
  if (ctx.reportFormulaEvaluation) {
    for (let i = 0; i < len; i++) {
      result[i] = applyFormula(args[i]!.formula, ctx, data, [
        'arguments',
        i,
        'formula',
      ])
    }
  } else {
    for (let i = 0; i < len; i++) {
      result[i] = applyFormula(args[i]!.formula, ctx, data)
    }
  }
  return result
}
