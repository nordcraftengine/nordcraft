import {
  applyFormula,
  type FormulaContext,
  type RecordOperation,
} from './formula'

export const applyRecordFormula = (
  formula: RecordOperation,
  ctx: FormulaContext,
) => {
  return Object.fromEntries(
    formula.entries.map((entry, i) => [
      entry.name,
      applyFormula(entry.formula, ctx, ['entries', i, 'formula']),
    ]),
  )
}
