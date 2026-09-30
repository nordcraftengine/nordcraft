/* eslint-disable no-console */
import type { ComponentData } from '../component/component.types'
import { isMeasureEnabled, measure, noopMeasure } from '../utils/measure'
import {
  applyFormula,
  type ApplyOperation,
  type BaseFormulaContext,
} from './formula'

export const applyApplyFormula = (
  formula: ApplyOperation,
  ctx: BaseFormulaContext,
  data: ComponentData,
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
  const stopMeasure = isMeasureEnabled()
    ? measure(`Formula: ${componentFormula.name}`, {
        formula,
        component: ctx.component?.name,
      })
    : noopMeasure
  const applyArgs = formula.arguments ?? []
  const shouldReport = ctx.reportFormulaEvaluation ? true : false
  const Input: Record<string, unknown> = {}
  for (let i = 0; i < applyArgs.length; i++) {
    const arg = applyArgs[i]!
    if (arg.isFunction) {
      const argFormula = arg.formula
      const argIndex = i
      Input[arg.name as string] = (Args: any) =>
        applyFormula(
          argFormula,
          ctx,
          {
            ...data,
            Args: data.Args ? { ...Args, '@toddle.parent': data.Args } : Args,
          },
          shouldReport ? ['arguments', argIndex] : undefined,
        )
    } else {
      Input[arg.name as string] = applyFormula(
        arg.formula,
        ctx,
        data,
        shouldReport ? ['arguments', i] : undefined,
      )
    }
  }
  const nextData = {
    ...data,
    Args: data.Args ? { ...Input, '@toddle.parent': data.Args } : Input,
  }
  const cache = ctx.formulaCache?.[formula.name]?.get(nextData)

  if (cache?.hit) {
    stopMeasure({ cache: 'hit' })
    return cache.data
  } else {
    const result = applyFormula(
      componentFormula.formula,
      ctx,
      nextData,
      shouldReport ? ['formula'] : undefined,
    )
    ctx.formulaCache?.[formula.name]?.set(nextData, result)
    stopMeasure({ cache: 'miss' })
    return result
  }
}
