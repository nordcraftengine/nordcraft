/* eslint-disable no-console */
import '../compileTime'
import type { ComponentData } from '../component/component.types'
import { BUILTIN_PREFIX } from '../const'
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
  data: ComponentData | undefined,
) => {
  const packageName = formula.package ?? ctx.package ?? undefined
  // TODO: Consider/benchmark if we should pass package as a separate argument to applyFormula instead of merging it into the context.
  const activeCtx: FormulaContext =
    packageName === ctx.package ? ctx : { ...ctx, package: packageName }
  const toddle =
    ctx.toddle ??
    ((globalThis as any).toddle as Toddle<unknown, unknown> | undefined)
  const isBuiltinFormula = formula.name.startsWith(BUILTIN_PREFIX)
  const newFunc = isBuiltinFormula
    ? undefined
    : toddle?.getCustomFormula(formula.name, packageName)
  if (isDefined(newFunc)) {
    const formulaArgs = formula.arguments
    const args: Record<string, unknown> = {}
    if (formulaArgs) {
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
    }
    try {
      return isToddleFormula(newFunc)
        ? applyFormula(
            newFunc.formula,
            activeCtx,
            { ...data, Args: args },
            IS_PREVIEW && ctx.reportFormulaEvaluation ? ['formula'] : undefined,
          )
        : newFunc.handler(args, {
            root:
              ctx.root ?? (typeof document !== 'undefined' ? document : null),
            env: ctx.env,
          } as any)
    } catch (e) {
      ctx.toddle.errors.push(e as Error)
      if (ctx.env?.logErrors) {
        console.error(e)
      }
      return null
    }
  } else {
    // Lookup legacy formula
    const legacyFunc: FormulaHandler | undefined = toddle?.getFormula(
      formula.name,
    )
    if (typeof legacyFunc === 'function') {
      const legacyArgs = formula.arguments
      const len = legacyArgs ? legacyArgs.length : 0
      const args: unknown[] = new Array(len)
      for (let i = 0; i < len; i++) {
        const arg = legacyArgs![i]!
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
        return legacyFunc(
          args,
          // Built-in formulas do not require data, but legacy custom formulas do
          (isBuiltinFormula ? activeCtx : { ...activeCtx, data }) as any,
        )
      } catch (e) {
        ctx.toddle.errors.push(e as Error)
        if (ctx.env?.logErrors) {
          console.error(e)
        }
        return null
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
