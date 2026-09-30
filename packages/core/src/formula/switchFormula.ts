import type { ComponentData } from '../component/component.types'
import { toBoolean } from '../utils/util'
import {
  applyFormula,
  type BaseFormulaContext,
  type SwitchOperation,
} from './formula'

export const applySwitchFormula = (
  formula: SwitchOperation,
  ctx: BaseFormulaContext,
  data: ComponentData,
) => {
  // Evaluates cases until one matches
  const cases = formula.cases ?? []
  if (ctx.reportFormulaEvaluation) {
    for (let i = 0; i < cases.length; i++) {
      const switchCase = cases[i]
      if (
        toBoolean(
          applyFormula(switchCase?.condition, ctx, data, [
            'cases',
            i,
            'condition',
          ]),
        )
      ) {
        return applyFormula(switchCase?.formula, ctx, data, [
          'cases',
          i,
          'formula',
        ])
      }
    }
    return applyFormula(formula.default, ctx, data, ['default'])
  }
  for (let i = 0; i < cases.length; i++) {
    const switchCase = cases[i]
    if (toBoolean(applyFormula(switchCase?.condition, ctx, data, undefined))) {
      return applyFormula(switchCase?.formula, ctx, data, undefined)
    }
  }
  return applyFormula(formula.default, ctx, data, undefined)
}

export const applyEvaluateAllSwitchFormula = (
  formula: SwitchOperation,
  ctx: BaseFormulaContext,
  data: ComponentData,
) => {
  // Evaluate all cases and the default, but only returns the first matching case or the default
  let switchResult: { match: true; value: any } | null = null
  for (let i = 0; i < (formula.cases ?? []).length; i++) {
    const switchCase = (formula.cases ?? [])[i]
    const conditionValue = applyFormula(switchCase?.condition, ctx, data, [
      'cases',
      i,
      'condition',
    ])
    const formulaValue = applyFormula(switchCase?.formula, ctx, data, [
      'cases',
      i,
      'formula',
    ])
    if (toBoolean(conditionValue) && switchResult === null) {
      switchResult = { match: true, value: formulaValue }
    }
  }
  const defaultValue = applyFormula(formula.default, ctx, data, ['default'])
  if (switchResult !== null) {
    return switchResult.value
  } else {
    return defaultValue
  }
}
