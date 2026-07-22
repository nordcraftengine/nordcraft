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
  args: any,
  packageName: string | null | undefined,
  jsonPath: Array<string | number> | undefined,
) => {
  return Object.fromEntries(
    (formula.entries ?? []).map((entry, i) => [
      entry.name,
      applyFormula(entry.formula, ctx, data, args, packageName, jsonPath, [
        'entries',
        i,
        'formula',
      ]),
    ]),
  )
}
