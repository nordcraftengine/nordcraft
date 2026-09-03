/* eslint-disable no-console */
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
  data: ComponentData,
  currentArgs: any,
  currentPackage: string | null | undefined,
  jsonPath: Array<string | number> | undefined,
  // eslint-disable-next-line max-params
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
  const stopMeasure = measure(() => [
    `Formula: ${componentFormula.name}`,
    {
      formula,
      component: ctx.component?.name,
    },
  ])

  const Input: Record<string, any> = {}
  const formulaArguments = formula.arguments ?? []
  for (let i = 0; i < formulaArguments.length; i++) {
    const arg = formulaArguments[i]
    if (!arg) {
      continue
    }
    const name = arg.name ?? `${i}`
    Input[name] = arg.isFunction
      ? (nestedArgs: any) =>
          applyFormula(
            arg.formula,
            ctx,
            data,
            currentArgs
              ? { ...nestedArgs, '@toddle.parent': currentArgs }
              : nestedArgs,
            currentPackage,
            jsonPath,
            ['arguments', i],
          )
      : applyFormula(
          arg.formula,
          ctx,
          data,
          currentArgs,
          currentPackage,
          jsonPath,
          ['arguments', i],
        )
  }

  const boundArgs = currentArgs
    ? { ...Input, '@toddle.parent': currentArgs }
    : Input

  const cache = ctx.formulaCache?.[formula.name]?.get(data)

  if (cache?.hit) {
    stopMeasure?.({ cache: 'hit' })
    return cache.data
  } else {
    const result = applyFormula(
      componentFormula.formula,
      ctx,
      data,
      boundArgs,
      currentPackage,
      jsonPath,
      ['formula'],
    )
    ctx.formulaCache?.[formula.name]?.set(data, result)
    stopMeasure?.({ cache: 'miss' })
    return result
  }
}
