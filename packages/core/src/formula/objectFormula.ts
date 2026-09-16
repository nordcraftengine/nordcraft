import type { ComponentData } from '../component/component.types'
import {
  applyFormula,
  type FormulaContext,
  type ObjectOperation,
} from './formula'

export const applyObjectFormula = (
  formula: ObjectOperation,
  ctx: FormulaContext,
  data: ComponentData,
  args: any,
  packageName: string | null | undefined,
  jsonPath: Array<string | number> | undefined,
) => {
  return Object.fromEntries(
    formula.arguments?.map((entry, i) => [
      entry.name,
      applyFormula(entry.formula, ctx, data, args, packageName, jsonPath, [
        'arguments',
        i,
        'formula',
      ]),
    ]) ?? [],
  )
}
