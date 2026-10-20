import type { ComponentData } from '../component/component.types'
import {
  applyFormula,
  type FormulaContext,
  type RecordOperation,
} from './formula'

export const applyRecordFormula = (
  formula: RecordOperation,
  ctx: FormulaContext,
  data: ComponentData,
) => {
  const entries = formula.entries ?? []
  const result: Record<string, unknown> = {}
  if (ctx.reportFormulaEvaluation) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]!
      result[entry.name as string] = applyFormula(entry.formula, ctx, data, [
        'entries',
        i,
        'formula',
      ])
    }
  } else {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]!
      result[entry.name as string] = applyFormula(entry.formula, ctx, data)
    }
  }
  return result
}
