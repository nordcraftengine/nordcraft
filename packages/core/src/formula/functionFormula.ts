/* eslint-disable no-console */
import '../compileTime'
import type { ComponentData } from '../component/component.types'
import type { FormulaHandler, Toddle } from '../types'
import { isMeasureEnabled, measure, noopMeasure } from '../utils/measure'
import { isDefined } from '../utils/util'
import {
  applyFormula,
  isToddleFormula,
  type BaseFormulaContext,
  type FunctionOperation,
} from './formula'

export const applyFunctionFormula = (
  formula: FunctionOperation,
  ctx: BaseFormulaContext,
  data: ComponentData,
) => {
  const stopMeasure = isMeasureEnabled()
    ? measure(`Formula: ${formula.name}`, {
        formula,
        component: ctx.component?.name,
      })
    : noopMeasure
  const packageName = formula.package ?? ctx.package ?? undefined
  // Thread an explicit package override without mutating the shared context:
  // previously this did `ctx.package = packageName`, which was only safe
  // because every caller passed a fresh `{ ...ctx, data }` copy.
  const activeCtx: BaseFormulaContext =
    packageName === ctx.package ? ctx : { ...ctx, package: packageName }
  const newFunc = (
    ctx.toddle ??
    ((globalThis as any).toddle as Toddle<unknown, unknown> | undefined)
  )?.getCustomFormula(formula.name, packageName)
  if (isDefined(newFunc)) {
    const formulaArgs = formula.arguments ?? []
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
                Args: data.Args
                  ? { ...Args, '@toddle.parent': data.Args }
                  : Args,
              },
              IS_PREVIEW && ctx.reportFormulaEvaluation
                ? ['arguments', i]
                : undefined,
            )
        : applyFormula(
            arg.formula,
            activeCtx,
            data,
            IS_PREVIEW && ctx.reportFormulaEvaluation
              ? ['arguments', i]
              : undefined,
          )
    }
    try {
      if (isToddleFormula(newFunc)) {
        return applyFormula(
          newFunc.formula,
          activeCtx,
          { ...data, Args: args },
          IS_PREVIEW && ctx.reportFormulaEvaluation ? ['formula'] : undefined,
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
                  Args: data.Args
                    ? { ...Args, '@toddle.parent': data.Args }
                    : Args,
                },
                IS_PREVIEW && ctx.reportFormulaEvaluation
                  ? ['arguments', i]
                  : undefined,
              )
          : applyFormula(
              arg.formula,
              activeCtx,
              data,
              IS_PREVIEW && ctx.reportFormulaEvaluation
                ? ['arguments', i]
                : undefined,
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
