import type { ComponentData } from '../component/component.types'
import {
  applyFormula,
  type ArrayOperation,
  type BaseFormulaContext,
} from './formula'

export const applyArrayFormula = (
  formula: ArrayOperation,
  ctx: BaseFormulaContext,
  data: ComponentData,
) => {
  const args = formula.arguments ?? []
  const len = args.length
  const result = new Array(len)
  // Avoid allocating per-argument path arrays when not reporting —
  // `extendedPath` is ignored by `applyFormula` in the fast path.
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
      result[i] = applyFormula(args[i]!.formula, ctx, data, undefined)
    }
  }
  return result
}
