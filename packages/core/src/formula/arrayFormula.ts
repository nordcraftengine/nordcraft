import '../compileTime'
import type { ComponentData } from '../component/component.types'
import {
  applyFormula,
  type ArrayOperation,
  type FormulaContext,
} from './formula'

export const applyArrayFormula = (
  formula: ArrayOperation,
  ctx: FormulaContext,
  data: ComponentData | undefined,
) => {
  const args = formula.arguments ?? []
  const len = args.length
  const result = new Array(len)
  for (let i = 0; i < len; i++) {
    result[i] = applyFormula(
      args[i]!.formula,
      ctx,
      data,
      IS_PREVIEW && ctx.reportFormulaEvaluation
        ? ['arguments', i, 'formula']
        : undefined,
    )
  }
  return result
}
