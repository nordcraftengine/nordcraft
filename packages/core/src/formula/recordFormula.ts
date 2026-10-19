import '../compileTime'
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
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!
    result[entry.name as string] = applyFormula(
      entry.formula,
      ctx,
      data,
      IS_PREVIEW && ctx.reportFormulaEvaluation
        ? ['entries', i, 'formula']
        : undefined,
    )
  }
  return result
}
