/* eslint-disable no-console */
import type { ComponentData } from '../component/component.types'
import type { FormulaHandler, Toddle } from '../types'
import { isMeasureEnabled, measure, noopMeasure } from '../utils/measure'
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
  data: ComponentData | undefined,
) => {
  const stopMeasure = isMeasureEnabled()
    ? measure(`Formula: ${formula.name}`, {
        formula,
        component: ctx.component?.name,
      })
    : noopMeasure
  const packageName = formula.package ?? ctx.package ?? undefined
  const activeCtx: FormulaContext =
    packageName === ctx.package ? ctx : { ...ctx, package: packageName }
  const newFunc = (
    ctx.toddle ??
    ((globalThis as any).toddle as Toddle<unknown, unknown> | undefined)
  )?.getCustomFormula(formula.name, packageName)
  if (isDefined(newFunc)) {
    const formulaArgs = formula.arguments ?? []
    const report = Boolean(ctx.reportFormulaEvaluation)
    const args: Record<string, unknown> = {}
    for (let i = 0; i < formulaArgs.length; i++) {
      const arg = formulaArgs[i]!
      args[arg.name ?? `${i}`] = arg.isFunction
        ? (Args: any) =>
            applyFormula(
              arg.formula,
              activeCtx,
              {
                ...data,
                Args: data?.Args
                  ? { ...Args, '@toddle.parent': data.Args }
                  : Args,
              },
              report ? ['arguments', i] : undefined,
            )
        : applyFormula(
            arg.formula,
            activeCtx,
            data,
            report ? ['arguments', i] : undefined,
          )
    }
    try {
      if (isToddleFormula(newFunc)) {
        return applyFormula(
          newFunc.formula,
          activeCtx,
          { ...data, Args: args },
          report ? ['formula'] : undefined,
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
      const legacyArgs = formula.arguments ?? []
      const legacyReport = Boolean(ctx.reportFormulaEvaluation)
      const args: unknown[] = new Array(legacyArgs.length)
      for (let i = 0; i < legacyArgs.length; i++) {
        const arg = legacyArgs[i]!
        args[i] = arg.isFunction
          ? (Args: any) =>
              applyFormula(
                arg.formula,
                activeCtx,
                {
                  ...data,
                  Args: data?.Args
                    ? { ...Args, '@toddle.parent': data.Args }
                    : Args,
                },
                legacyReport ? ['arguments', i] : undefined,
              )
          : applyFormula(
              arg.formula,
              activeCtx,
              data,
              legacyReport ? ['arguments', i] : undefined,
            )
      }
      try {
        return legacyFunc(args, { ...activeCtx, data } as any)
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
