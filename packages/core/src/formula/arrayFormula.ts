import {
  applyFormula,
  type ArrayOperation,
  type FormulaContext,
} from './formula'

export const applyArrayFormula = (
  formula: ArrayOperation,
  ctx: FormulaContext,
) => {
  return formula.arguments.map((entry, i) =>
    applyFormula(entry.formula, ctx, ['arguments', i, 'formula']),
  )
}
