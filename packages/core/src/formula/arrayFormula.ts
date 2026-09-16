import type { ComponentData } from '../component/component.types'
import {
  applyFormula,
  type ArrayOperation,
  type FormulaContext,
} from './formula'

export const applyArrayFormula = (
  formula: ArrayOperation,
  ctx: FormulaContext,
  data: ComponentData,
  args: any,
  packageName: string | null | undefined,
  jsonPath: Array<string | number> | undefined,
) => {
  return (formula.arguments ?? []).map((entry, i) =>
    applyFormula(entry.formula, ctx, data, args, packageName, jsonPath, [
      'arguments',
      i,
      'formula',
    ]),
  )
}
