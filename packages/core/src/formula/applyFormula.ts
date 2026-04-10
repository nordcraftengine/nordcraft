import { measure } from '../utils/measure'
import {
  applyFormula,
  type ApplyOperation,
  type FormulaContext,
} from './formula'

export const applyApplyFormula = (
  formula: ApplyOperation,
  ctx: FormulaContext,
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
  const Input = Object.fromEntries(
    (formula.arguments ?? []).map((arg) =>
      arg.isFunction
        ? [
            arg.name,
            (Args: any) =>
              applyFormula(arg.formula, {
                ...ctx,
                data: {
                  ...ctx.data,
                  Args: ctx.data.Args
                    ? { ...Args, '@toddle.parent': ctx.data.Args }
                    : Args,
                },
              }),
          ]
        : [arg.name, applyFormula(arg.formula, ctx)],
    ),
  )
  const data = {
    ...ctx.data,
    Args: ctx.data.Args ? { ...Input, '@toddle.parent': ctx.data.Args } : Input,
  }
  const cache = ctx.formulaCache?.[formula.name]?.get(data)

  if (cache?.hit) {
    stopMeasure({ cache: 'hit' })
    return cache.data
  } else {
    const result = applyFormula(componentFormula.formula, {
      ...ctx,
      data,
    })
    ctx.formulaCache?.[formula.name]?.set(data, result)
    stopMeasure({ cache: 'miss' })
    return result
  }
}
