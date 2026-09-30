import type { ComponentData } from '../component/component.types'
import {
  applyFormula,
  type BaseFormulaContext,
  type ObjectOperation,
} from './formula'

export const applyObjectFormula = (
  formula: ObjectOperation,
  ctx: BaseFormulaContext,
  data: ComponentData,
) => {
  const args = formula.arguments ?? []
  const result: Record<string, unknown> = {}
  if (ctx.reportFormulaEvaluation) {
    for (let i = 0; i < args.length; i++) {
      const entry = args[i]!
      result[entry.name as string] = applyFormula(entry.formula, ctx, data, [
        'arguments',
        i,
        'formula',
      ])
    }
  } else {
    for (let i = 0; i < args.length; i++) {
      const entry = args[i]!
      result[entry.name as string] = applyFormula(
        entry.formula,
        ctx,
        data,
        undefined,
      )
    }
  }
  return result
}
