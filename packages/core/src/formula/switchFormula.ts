/* eslint-disable max-params */
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
  data?: ComponentData,
  path?: Array<string | number>,
) => {
  // Evaluates cases until one matches
  const cases = formula.cases ?? []
  for (let i = 0; i < cases.length; i++) {
    const switchCase = cases[i]
    if (
      toBoolean(
        applyFormula(
          switchCase?.condition,
          ctx,
          data,
          ctx.reportFormulaEvaluation
            ? path
              ? [...path, 'cases', i, 'condition']
              : ['cases', i, 'condition']
            : undefined,
        ),
      )
    ) {
      return applyFormula(
        switchCase?.formula,
        ctx,
        data,
        ctx.reportFormulaEvaluation
          ? path
            ? [...path, 'cases', i, 'formula']
            : ['cases', i, 'formula']
          : undefined,
      )
    }
  }
  return applyFormula(
    formula.default,
    ctx,
    data,
    ctx.reportFormulaEvaluation
      ? path
        ? [...path, 'default']
        : ['default']
      : undefined,
  )
}

export const applyEvaluateAllSwitchFormula = (
  formula: SwitchOperation,
  ctx: FormulaContext,
  data?: ComponentData,
  path?: Array<string | number>,
) => {
  // Evaluate all cases and the default, but only returns the first matching case or the default
  let switchResult: { match: true; value: any } | null = null
  const cases = formula.cases ?? []
  for (let i = 0; i < cases.length; i++) {
    const switchCase = cases[i]
    const conditionValue = applyFormula(
      switchCase?.condition,
      ctx,
      data,
      ctx.reportFormulaEvaluation
        ? path
          ? [...path, 'cases', i, 'condition']
          : ['cases', i, 'condition']
        : undefined,
    )
    const formulaValue = applyFormula(
      switchCase?.formula,
      ctx,
      data,
      ctx.reportFormulaEvaluation
        ? path
          ? [...path, 'cases', i, 'formula']
          : ['cases', i, 'formula']
        : undefined,
    )
    if (toBoolean(conditionValue) && switchResult === null) {
      switchResult = { match: true, value: formulaValue }
    }
  }
  const defaultValue = applyFormula(
    formula.default,
    ctx,
    data,
    ctx.reportFormulaEvaluation
      ? path
        ? [...path, 'default']
        : ['default']
      : undefined,
  )
  if (switchResult !== null) {
    return switchResult.value
  } else {
    return defaultValue
  }
}
