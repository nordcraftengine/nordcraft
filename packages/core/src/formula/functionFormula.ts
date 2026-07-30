/* eslint-disable no-console */
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
  data: ComponentData,
  currentArgs: any,
  currentPackage: string | null | undefined,
  jsonPath: Array<string | number> | undefined,
  // eslint-disable-next-line max-params
) => {
  const stopMeasure = measure(() => [
    `Formula: ${formula.name}`,
    {
      formula,
      component: ctx.component?.name,
    },
  ])
  const packageName = formula.package ?? currentPackage ?? undefined
  const newFunc = (
    ctx.toddle ??
    ((globalThis as any).toddle as Toddle<unknown, unknown> | undefined)
  )?.getCustomFormula(formula.name, packageName)
  if (isDefined(newFunc)) {
    const fnArgs: Record<string, unknown> = {}
    const formulaArguments = formula.arguments ?? []
    for (let i = 0; i < formulaArguments.length; i++) {
      const arg = formulaArguments[i]
      if (!arg) {
        continue
      }
      const name = arg.name ?? `${i}`
      fnArgs[name] = arg.isFunction
        ? (nestedArgs: any) =>
            applyFormula(
              arg.formula,
              ctx,
              data,
              currentArgs
                ? { ...nestedArgs, '@toddle.parent': currentArgs }
                : nestedArgs,
              packageName,
              jsonPath,
              ['arguments', i],
            )
        : applyFormula(
            arg.formula,
            ctx,
            data,
            currentArgs,
            packageName,
            jsonPath,
            ['arguments', i],
          )
    }
    try {
      if (isToddleFormula(newFunc)) {
        return applyFormula(
          newFunc.formula,
          ctx,
          data,
          fnArgs,
          packageName,
          jsonPath,
          ['formula'],
        )
      } else {
        return newFunc.handler(fnArgs, {
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
      stopMeasure?.()
    }
  } else {
    // Lookup legacy formula
    const legacyFunc: FormulaHandler | undefined = (
      ctx.toddle ?? ((globalThis as any).toddle as Toddle<unknown, unknown>)
    ).getFormula(formula.name)
    if (typeof legacyFunc === 'function') {
      const legacyArgs: any[] = []
      const formulaArguments = formula.arguments ?? []
      for (let i = 0; i < formulaArguments.length; i++) {
        const arg = formulaArguments[i]
        if (!arg) {
          legacyArgs.push(undefined)
          continue
        }
        legacyArgs.push(
          arg.isFunction
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
              ),
        )
      }
      try {
        return legacyFunc(legacyArgs, ctx as any)
      } catch (e) {
        ctx.toddle.errors.push(e as Error)
        if (ctx.env?.logErrors) {
          console.error(e)
        }
        return null
      } finally {
        stopMeasure?.()
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
