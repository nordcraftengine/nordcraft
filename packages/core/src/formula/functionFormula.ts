import type { FormulaHandler, Toddle } from '../types'
import { isDefined } from '../utils/util'
import {
  applyFormula,
  isToddleFormula,
  type FormulaContext,
  type FunctionOperation,
} from './formula'

export const applyFunctionFormula = (
  formula: FunctionOperation,
  ctx: FormulaContext,
) => {
  const packageName = formula.package ?? ctx.package
  const newFunc = (
    ctx.toddle ??
    ((globalThis as any).toddle as Toddle<unknown, unknown> | undefined)
  )?.getCustomFormula(formula.name, packageName)
  if (isDefined(newFunc)) {
    ctx.package = packageName
    const args = formula.arguments.reduce<Record<string, unknown>>(
      (args, arg, i) => ({
        ...args,
        [arg.name ?? `${i}`]: arg.isFunction
          ? (Args: any) => {
              return applyFormula(
                arg.formula,
                {
                  ...ctx,
                  data: {
                    ...ctx.data,
                    Args: ctx.data.Args
                      ? { ...Args, '@toddle.parent': ctx.data.Args }
                      : Args,
                  },
                },
                ['arguments', i],
              )
            }
          : applyFormula(arg.formula, ctx, ['arguments', i, 'formula']),
      }),
      {},
    )
    try {
      if (isToddleFormula(newFunc)) {
        return applyFormula(
          newFunc.formula,
          {
            ...ctx,
            data: { ...ctx.data, Args: args },
          },
          ['formula'],
        )
      } else {
        return newFunc.handler(args, {
          root: ctx.root ?? document,
          env: ctx.env,
        } as any)
      }
    } catch (e) {
      ctx.toddle.errors.push(e as Error)
      if (ctx.env?.logErrors) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
      return null
    }
  } else {
    // Lookup legacy formula
    const legacyFunc: FormulaHandler | undefined = (
      ctx.toddle ?? ((globalThis as any).toddle as Toddle<unknown, unknown>)
    ).getFormula(formula.name)
    if (typeof legacyFunc === 'function') {
      const args = (formula.arguments ?? []).map((arg, i) =>
        arg.isFunction
          ? (Args: any) =>
              applyFormula(
                arg.formula,
                {
                  ...ctx,
                  data: {
                    ...ctx.data,
                    Args: ctx.data.Args
                      ? { ...Args, '@toddle.parent': ctx.data.Args }
                      : Args,
                  },
                },
                ['arguments', i],
              )
          : applyFormula(arg.formula, ctx, ['arguments', i, 'formula']),
      )
      try {
        return legacyFunc(args, ctx as any)
      } catch (e) {
        ctx.toddle.errors.push(e as Error)
        if (ctx.env?.logErrors) {
          // eslint-disable-next-line no-console
          console.error(e)
        }
        return null
      }
    }
  }
  if (ctx.env?.logErrors) {
    // eslint-disable-next-line no-console
    console.error(
      `Could not find formula ${formula.name} in package ${packageName ?? ''}`,
      formula,
    )
  }
  return null
}
