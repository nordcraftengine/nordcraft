import type { ComponentData } from '../component/component.types'
import {
  applyFormula,
  type FormulaContext,
  type ObjectOperation,
} from './formula'

export const applyObjectFormula = (
  formula: ObjectOperation,
  ctx: FormulaContext,
  data: ComponentData | undefined,
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
      result[entry.name as string] = applyFormula(entry.formula, ctx, data)
    }
  }
  return result
}
