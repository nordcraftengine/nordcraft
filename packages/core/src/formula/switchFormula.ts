import { toBoolean } from '../utils/util'
import {
  applyFormula,
  type FormulaContext,
  type SwitchOperation,
} from './formula'

export const applySwitchFormula = (
  formula: SwitchOperation,
  ctx: FormulaContext,
) => {
  // Evaluates cases until one matches
  for (let i = 0; i < (formula.cases ?? []).length; i++) {
    const switchCase = (formula.cases ?? [])[i]
    if (
      toBoolean(
        applyFormula(switchCase?.condition, ctx, [
          'cases',
          i,
          'condition',
          'formula',
        ]),
      )
    ) {
      return applyFormula(switchCase?.formula, ctx, [
        'cases',
        i,
        'formula',
        'formula',
      ])
    }
  }
  return applyFormula(formula.default, ctx, ['default', 'formula'])
}

export const applyEvaluateAllSwitchFormula = (
  formula: SwitchOperation,
  ctx: FormulaContext,
) => {
  // Evaluate all cases and the default, but only returns the first matching case or the default
  let switchResult: { match: true; value: any } | null = null
  for (let i = 0; i < (formula.cases ?? []).length; i++) {
    const switchCase = (formula.cases ?? [])[i]
    const conditionValue = applyFormula(switchCase?.condition, ctx, [
      'cases',
      i,
      'condition',
      'formula',
    ])
    const formulaValue = applyFormula(switchCase?.formula, ctx, [
      'cases',
      i,
      'formula',
      'formula',
    ])
    if (toBoolean(conditionValue) && switchResult === null) {
      switchResult = { match: true, value: formulaValue }
    }
  }
  const defaultValue = applyFormula(formula.default, ctx, [
    'default',
    'formula',
  ])
  if (switchResult !== null) {
    return switchResult.value
  } else {
    return defaultValue
  }
}
