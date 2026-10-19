import type { ComponentData } from '@nordcraft/core/dist/component/component.types'
import type { FormulaContext } from '@nordcraft/core/dist/formula/formula'
import type { ComponentContext } from '../types'

type CreateFormulaContextOptions = {
  jsonPath?: Array<string | number>
  includeReportFormulaEvaluation?: boolean
}

/**
 * For performance reasons, we should avoid this function being called too often,
 * and instead pass the ctx directly and the data as a separate argument to functions,
 * instead of destructuring and constructing over and over.
 *
 * The overhead per request is small, but if done once per formula evaluation, the
 * direct overhead can be significant, and the indirect overhead of creating new objects
 * and garbage collection can be significant as well.
 */
export function createFormulaContext(
  ctx: ComponentContext,
  data?: ComponentData | CreateFormulaContextOptions,
  options?: CreateFormulaContextOptions,
): FormulaContext {
  const resolvedOptions =
    options ??
    (data && ('jsonPath' in data || 'includeReportFormulaEvaluation' in data)
      ? (data as CreateFormulaContextOptions)
      : undefined)
  const formulaContext: FormulaContext = {
    component: ctx.component,
    formulaCache: ctx.formulaCache,
    root: ctx.root,
    package: ctx.package,
    toddle: ctx.toddle,
    env: ctx.env,
    jsonPath: resolvedOptions?.jsonPath ?? ctx.jsonPath,
  }

  if (resolvedOptions?.includeReportFormulaEvaluation !== false) {
    formulaContext.reportFormulaEvaluation = ctx.reportFormulaEvaluation
  }

  return formulaContext
}
