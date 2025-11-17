import {
  applyFormula,
  type FormulaContext,
  type ObjectOperation,
} from './formula'

export const applyObjectFormula = (
  formula: ObjectOperation,
  ctx: FormulaContext,
) => {
  return Object.fromEntries(
    formula.arguments?.map((entry, i) => [
      entry.name,
      applyFormula(entry.formula, ctx, ['arguments', i, 'formula']),
    ]) ?? [],
  )
}
