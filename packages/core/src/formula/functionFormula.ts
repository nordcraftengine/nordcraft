/* eslint-disable no-console, max-params */
import type { ComponentData } from '../component/component.types'
import type { FormulaHandler, Toddle } from '../types'
import { measure } from '../utils/measure'
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
  data?: ComponentData,
  path?: Array<string | number>,
) => {
  const stopMeasure = measure(`Formula: ${formula.name}`, {
    formula,
    component: ctx.component?.name,
  })
  const packageName = formula.package ?? ctx.package ?? undefined
  const newFunc = (
    ctx.toddle ??
    ((globalThis as any).toddle as Toddle<unknown, unknown> | undefined)
  )?.getCustomFormula(formula.name, packageName)
  const resolvedData: ComponentData = data ?? { Attributes: {} }
  if (isDefined(newFunc)) {
    const formulaCtx =
      packageName !== ctx.package ? { ...ctx, package: packageName } : ctx
    const formulaArgs = formula.arguments ?? []
    const args: Record<string, unknown> = {}
    for (let i = 0; i < formulaArgs.length; i++) {
      const arg = formulaArgs[i]
      if (!arg) {
        continue
      }
      const key = arg.name ?? `${i}`
      const argPath = ctx.reportFormulaEvaluation
        ? path
          ? [...path, 'arguments', i]
          : ['arguments', i]
        : undefined
      args[key] = arg.isFunction
        ? (Args: any) =>
            applyFormula(
              arg.formula,
              formulaCtx,
              {
                ...resolvedData,
                Args: resolvedData.Args
                  ? { ...Args, '@toddle.parent': resolvedData.Args }
                  : Args,
              },
              argPath,
            )
        : applyFormula(arg.formula, formulaCtx, resolvedData, argPath)
    }
    try {
      if (isToddleFormula(newFunc)) {
        return applyFormula(
          newFunc.formula,
          formulaCtx,
          { ...resolvedData, Args: args },
          ctx.reportFormulaEvaluation
            ? path
              ? [...path, 'formula']
              : ['formula']
            : undefined,
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
        console.error(e)
      }
      return null
    } finally {
      stopMeasure()
    }
  } else {
    // Lookup legacy formula
    const legacyFunc: FormulaHandler | undefined = (
      ctx.toddle ?? ((globalThis as any).toddle as Toddle<unknown, unknown>)
    ).getFormula(formula.name)
    if (typeof legacyFunc === 'function') {
      const formulaArgs = formula.arguments ?? []
      const args = new Array(formulaArgs.length)
      for (let i = 0; i < formulaArgs.length; i++) {
        const arg = formulaArgs[i]
        const argPath = ctx.reportFormulaEvaluation
          ? path
            ? [...path, 'arguments', i]
            : ['arguments', i]
          : undefined
        args[i] = arg?.isFunction
          ? (Args: any) =>
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
          : arg
            ? applyFormula(arg.formula, ctx, resolvedData, argPath)
            : undefined
      }
      try {
        return legacyFunc(args, { ...ctx, data: resolvedData } as any)
      } catch (e) {
        ctx.toddle.errors.push(e as Error)
        if (ctx.env?.logErrors) {
          console.error(e)
        }
        return null
      } finally {
        stopMeasure()
      }
    }
  }
  if (ctx.env?.logErrors) {
    console.error(
      `Could not find formula ${formula.name} in package ${packageName ?? ''}`,
      formula,
    )
  }
  return null
}
