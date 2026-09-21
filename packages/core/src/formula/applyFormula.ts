/* eslint-disable no-console, max-params */
import type { ComponentData } from '../component/component.types'
import { measure } from '../utils/measure'
import {
  applyFormula,
  type ApplyOperation,
  type FormulaContext,
} from './formula'

export const applyApplyFormula = (
  formula: ApplyOperation,
  ctx: FormulaContext,
  data?: ComponentData,
  path?: Array<string | number>,
) => {
  const componentFormula = ctx.component?.formulas?.[formula.name]
  if (!componentFormula) {
    if (ctx.env?.logErrors) {
      console.log(
        'Component does not have a formula with the name ',
        formula.name,
      )
    }
    return null
  }
  const stopMeasure = measure(`Formula: ${componentFormula.name}`, {
    formula,
    component: ctx.component?.name,
  })
  const resolvedData: ComponentData = data ?? { Attributes: {} }
  const Input: Record<string, any> = {}
  const formulaArgs = formula.arguments ?? []
  for (let i = 0; i < formulaArgs.length; i++) {
    const arg = formulaArgs[i]
    if (!arg?.name) {
      continue
    }
    const argPath = ctx.reportFormulaEvaluation
      ? path
        ? [...path, 'arguments', i]
        : ['arguments', i]
      : undefined
    if (arg.isFunction) {
      Input[arg.name] = (Args: any) =>
        applyFormula(
          arg.formula,
          ctx,
          {
            ...resolvedData,
            Args: resolvedData.Args
              ? { ...Args, '@toddle.parent': resolvedData.Args }
              : Args,
          },
          argPath,
        )
    } else {
      Input[arg.name] = applyFormula(arg.formula, ctx, resolvedData, argPath)
    }
  }
  const childData: ComponentData = {
    ...resolvedData,
    Args: resolvedData.Args
      ? { ...Input, '@toddle.parent': resolvedData.Args }
      : Input,
  }
  const cache = ctx.formulaCache?.[formula.name]?.get(childData)

  if (cache?.hit) {
    stopMeasure({ cache: 'hit' })
    return cache.data
  } else {
    const result = applyFormula(
      componentFormula.formula,
      ctx,
      childData,
      ctx.reportFormulaEvaluation
        ? path
          ? [...path, 'formula']
          : ['formula']
        : undefined,
    )
    ctx.formulaCache?.[formula.name]?.set(childData, result)
    stopMeasure({ cache: 'miss' })
    return result
  }
}
