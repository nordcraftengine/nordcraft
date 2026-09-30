import type { ComponentData } from '../component/component.types'
import {
  applyFormula,
  type BaseFormulaContext,
  type RecordOperation,
} from './formula'

export const applyRecordFormula = (
  formula: RecordOperation,
  ctx: BaseFormulaContext,
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
