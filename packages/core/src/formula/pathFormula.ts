import type { FormulaContext, PathOperation } from './formula'

export const applyPathFormula = (
  formula: PathOperation,
  data: FormulaContext['data'],
) => {
  let input: any = data
  for (const key of formula.path) {
    if (input && typeof input === 'object') {
      input = input[key]
    } else {
      return null
    }
  }
  return input
}
