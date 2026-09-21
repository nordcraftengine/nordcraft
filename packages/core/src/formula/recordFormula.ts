/* eslint-disable max-params */
import type { ComponentData } from '../component/component.types'
import {
  applyFormula,
  type FormulaContext,
  type RecordOperation,
} from './formula'

export const applyRecordFormula = (
  formula: RecordOperation,
  ctx: FormulaContext,
  data?: ComponentData,
  path?: Array<string | number>,
) => {
  const result: Record<string, any> = {}
  if (!formula.entries) {
    return result
  }
  for (let i = 0; i < formula.entries.length; i++) {
    const entry = formula.entries[i]
    if (entry?.name) {
      result[entry.name] = applyFormula(
        entry.formula,
        ctx,
        data,
        ctx.reportFormulaEvaluation
          ? path
            ? [...path, 'entries', i, 'formula']
            : ['entries', i, 'formula']
          : undefined,
      )
    }
  }
  return result
}
