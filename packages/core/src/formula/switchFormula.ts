import type { ComponentData } from '../component/component.types'
import { toBoolean } from '../utils/util'
import {
  applyFormula,
  type FormulaContext,
  type SwitchOperation,
} from './formula'

export const applySwitchFormula = (
  formula: SwitchOperation,
  ctx: FormulaContext,
  data: ComponentData,
  args: any,
  packageName: string | null | undefined,
  jsonPath: Array<string | number> | undefined,
) => {
  // Evaluates cases until one matches
  for (let i = 0; i < (formula.cases ?? []).length; i++) {
    const switchCase = (formula.cases ?? [])[i]
    if (
      toBoolean(
        applyFormula(
          switchCase?.condition,
          ctx,
          data,
          args,
          packageName,
          jsonPath,
          ['cases', i, 'condition'],
        ),
      )
    ) {
      return applyFormula(
        switchCase?.formula,
        ctx,
        data,
        args,
        packageName,
        jsonPath,
        ['cases', i, 'formula'],
      )
    }
  }
  return applyFormula(formula.default, ctx, data, args, packageName, jsonPath, [
    'default',
  ])
}

export const applyEvaluateAllSwitchFormula = (
  formula: SwitchOperation,
  ctx: FormulaContext,
  data: ComponentData,
  args: any,
  packageName: string | null | undefined,
  jsonPath: Array<string | number> | undefined,
) => {
  // Evaluate all cases and the default, but only returns the first matching case or the default
  let switchResult: { match: true; value: any } | null = null
  for (let i = 0; i < (formula.cases ?? []).length; i++) {
    const switchCase = (formula.cases ?? [])[i]
    const conditionValue = applyFormula(
      switchCase?.condition,
      ctx,
      data,
      args,
      packageName,
      jsonPath,
      ['cases', i, 'condition'],
    )
    const formulaValue = applyFormula(
      switchCase?.formula,
      ctx,
      data,
      args,
      packageName,
      jsonPath,
      ['cases', i, 'formula'],
    )
    if (toBoolean(conditionValue) && switchResult === null) {
      switchResult = { match: true, value: formulaValue }
    }
  }
  const defaultValue = applyFormula(
    formula.default,
    ctx,
    data,
    args,
    packageName,
    jsonPath,
    ['default'],
  )
  if (switchResult !== null) {
    return switchResult.value
  } else {
    return defaultValue
  }
}
