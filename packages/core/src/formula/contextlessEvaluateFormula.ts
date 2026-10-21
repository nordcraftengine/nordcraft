import type { Component, ComponentData } from '../component/component.types'
import type { CustomFormulaHandler, FormulaLookup, Nullable } from '../types'
import { isDefined, toBoolean } from '../utils/util'
import {
  applyFormula,
  isFormula,
  isToddleFormula,
  type Formula,
  type FormulaContext,
  type ValueOperation,
} from './formula'
import type { PluginFormula } from './formulaTypes'
import { applyPathFormula } from './pathFormula'

/**
 * Lib formulas that can NOT be statically evaluated.
 *
 * Everything else exported from `@nordcraft/std-lib` is considered pure
 * and deterministic (given static arguments, the result is static).
 *
 * Excluded because they are non-deterministic, environment/browser specific,
 * or depend on external state:
 */
export const NON_STATIC_LIB_FORMULAS: ReadonlySet<string> = new Set([
  'Id',
  'branchName',
  'canShare',
  'currentURL',
  'formatNumber',
  'getCookie',
  'getElementById',
  'getFromLocalStorage',
  'getFromSessionStorage',
  'getHttpOnlyCookie',
  'isServer',
  'languages',
  'now',
  'randomNumber',
  'range',
  'shuffle',
  'userAgent',
])

export const PURE_LIB_FORMULAS: ReadonlySet<string> = new Set<string>([
  'absolute',
  'add',
  'append',
  'boolean',
  'capitalize',
  'clamp',
  'concatenate',
  'dateFromString',
  'dateFromTimestamp',
  'decodeBase64',
  'decodeURIComponent',
  'defaultTo',
  'deleteKey',
  'divide',
  'drop',
  'dropLast',
  'encodeBase64',
  'encodeJSON',
  'encodeURIComponent',
  'entries',
  'equals',
  'every',
  'filter',
  'find',
  'findIndex',
  'findLast',
  'first',
  'flatten',
  'formatDate',
  'fromEntries',
  'get',
  'greaterOrEqueal',
  'greaterThan',
  'groupBy',
  'includes',
  'indexOf',
  'join',
  'json',
  'keyBy',
  'last',
  'lastIndexOf',
  'lessOrEqual',
  'lessThan',
  'logarithm',
  'lowercase',
  'map',
  'matches',
  'max',
  'min',
  'minus',
  'modulo',
  'multiply',
  'not',
  'notEqual',
  'number',
  'parseJSON',
  'parseURL',
  'power',
  'prepend',
  'reduce',
  'replaceAll',
  'reverse',
  'round',
  'roundDown',
  'roundUp',
  'set',
  'size',
  'some',
  'sort_by',
  'split',
  'squareRoot',
  'startsWith',
  'string',
  'sum',
  'take',
  'takeLast',
  'timestamp',
  'trim',
  'typeOf',
  'unique',
  'uppercase',
])

export const normalizeFormulaName = (name: string) =>
  name.startsWith('@toddle/') ? name.slice(8) : name

export interface EvaluationContext {
  inFunctionScope?: boolean
  component: Component | undefined
  formulas?: Record<string, PluginFormula<any>>
  packages?: Partial<
    Record<string, { formulas?: Record<string, PluginFormula<any>> }>
  >
  visitedFormulas?: Set<string>
  toddle?: {
    getFormula?: FormulaLookup
    getCustomFormula?: CustomFormulaHandler
  }
  data?: ComponentData
}

export const createStaticFormulaContext = (
  ctx: EvaluationContext,
): {
  formulaContext: FormulaContext
  hasFailed: () => boolean
} => {
  let hasMissingFormula = false
  const errors: Error[] = []

  let component = ctx.component
  if (component?.formulas) {
    const rawFormulas = component.formulas
    component = {
      ...component,
      formulas: new Proxy(rawFormulas, {
        get(target, prop, receiver) {
          if (typeof prop === 'string') {
            const val = Reflect.get(target, prop, receiver)
            if (val === undefined) {
              hasMissingFormula = true
            }
            return val
          }
          return Reflect.get(target, prop, receiver)
        },
      }),
    }
  }

  const getCustomFormula: CustomFormulaHandler =
    ctx.toddle?.getCustomFormula ??
    ((name: string, packageName?: string | null) => {
      let formula: PluginFormula<any> | undefined
      if (isDefined(packageName)) {
        formula = ctx.packages?.[packageName]?.formulas?.[name]
      } else {
        formula = ctx.formulas?.[name]
      }
      if (formula && isToddleFormula(formula)) {
        return formula as any
      }
      return undefined
    })

  const getFormula: FormulaLookup = (name: string) => {
    const custom = ctx.toddle?.getFormula
    let handler: FormulaLookup extends (name: string) => infer R ? R : never =
      undefined
    if (custom) {
      const normalized = normalizeFormulaName(name)
      handler =
        custom(name) ?? custom(`@toddle/${normalized}`) ?? custom(normalized)
    }
    if (!handler && (globalThis as any).toddle?.getFormula) {
      const normalized = normalizeFormulaName(name)
      handler =
        (globalThis as any).toddle.getFormula(name) ??
        (globalThis as any).toddle.getFormula(`@toddle/${normalized}`) ??
        (globalThis as any).toddle.getFormula(normalized)
    }
    if (!handler) {
      hasMissingFormula = true
    }
    return handler
  }

  const formulaContext: FormulaContext = {
    component,
    data: ctx.data ?? { Attributes: {} },
    package: null,
    toddle: {
      getFormula,
      getCustomFormula,
      errors,
    },
    env: undefined,
  }

  return {
    formulaContext,
    hasFailed: () => hasMissingFormula,
  }
}

export const toFormulaContext = (ctx: EvaluationContext): FormulaContext =>
  createStaticFormulaContext(ctx).formulaContext

/**
 * Static evaluation of a formula.
 *
 * Can be used by issues to determine if a formula or sub-formula can be reduced to a static value.
 * When sophisticated enough, it can be used during compile-time to reduce all static subgraphs of a formula to static values, greatly reducing payload and improving runtime performance.
 *
 * @returns {
 *  isStatic: boolean; // Whether the formula is static (i.e., does not depend on any variables, context AND only use pure formulas (no Random, Date, etc.))
 *  result: unknown; // The evaluated value of the formula
 * }
 */
export const contextlessEvaluateFormula = (
  formula: Nullable<Formula>,
  ctx: EvaluationContext,
): {
  isStatic: boolean
  result: unknown
} => {
  if (!formula) {
    return {
      isStatic: true,
      result: formula,
    }
  }

  switch (formula.type) {
    case 'value': {
      return {
        isStatic: true,
        result: formula.value,
      }
    }

    case 'array': {
      const results = (formula.arguments ?? []).map((arg) =>
        contextlessEvaluateFormula(arg.formula, ctx),
      )

      return {
        isStatic: results.every((res) => res.isStatic),
        result: results.map((res) => res.result),
      }
    }

    case 'record': {
      if (Array.isArray(formula.entries)) {
        const results = formula.entries.map((arg) => ({
          name: arg.name,
          eval: contextlessEvaluateFormula(arg.formula, ctx),
        }))

        const isStatic = results.every((res) => res.eval.isStatic)
        if (!isStatic) {
          return {
            isStatic: false,
            result: undefined,
          }
        }

        const hasAllResults = results.every(
          (res) => res.eval.result !== undefined,
        )
        if (!hasAllResults) {
          return {
            isStatic: true,
            result: undefined,
          }
        }

        const result: Record<string, unknown> = {}
        for (const res of results) {
          if (typeof res.name === 'string') {
            result[res.name] = res.eval.result
          }
        }
        return {
          isStatic: true,
          result,
        }
      }

      // Fallback for legacy untyped dictionary representation
      const rawEntries = formula.entries as unknown
      if (rawEntries && typeof rawEntries === 'object') {
        const entries = Object.entries(
          rawEntries as Record<string, { formula?: Nullable<Formula> }>,
        ).map(
          ([key, arg]) =>
            [key, contextlessEvaluateFormula(arg?.formula, ctx)] as const,
        )

        const isStatic = entries.every(([, res]) => res.isStatic)
        const hasAllResults = entries.every(
          ([, res]) => res.result !== undefined,
        )

        return {
          isStatic,
          result:
            isStatic && hasAllResults
              ? Object.fromEntries(
                  entries.map(([key, res]) => [key, res.result]),
                )
              : undefined,
        }
      }

      return {
        isStatic: true,
        result: {},
      }
    }

    case 'object': {
      const results = (formula.arguments ?? []).map((arg) => ({
        name: arg.name,
        eval: contextlessEvaluateFormula(arg.formula, ctx),
      }))

      const isStatic = results.every((res) => res.eval.isStatic)
      if (!isStatic) {
        return {
          isStatic: false,
          result: undefined,
        }
      }

      const hasAllResults = results.every(
        (res) => res.eval.result !== undefined,
      )
      if (!hasAllResults) {
        return {
          isStatic: true,
          result: undefined,
        }
      }

      const result: Record<string, unknown> = {}
      for (const res of results) {
        if (typeof res.name === 'string') {
          result[res.name] = res.eval.result
        }
      }
      return {
        isStatic: true,
        result,
      }
    }

    // Static if:
    // - ALL conditions are static AND truthy
    // - ANY condition is static and falsy
    // - EMPTY argument list is always true
    case 'and': {
      const results = (formula.arguments ?? []).map((arg) =>
        contextlessEvaluateFormula(arg.formula, ctx),
      )

      const alwaysTrue =
        results.length === 0 ||
        results.every(
          (res) =>
            res.isStatic && res.result !== undefined && toBoolean(res.result),
        )
      const alwaysFalsy = results.some(
        (res) =>
          res.isStatic && res.result !== undefined && !toBoolean(res.result),
      )

      return {
        isStatic: alwaysTrue || alwaysFalsy,
        result: alwaysTrue ? true : alwaysFalsy ? false : undefined,
      }
    }

    // Static if:
    // - ANY condition is static AND truthy
    // - ALL conditions are static AND falsy
    // - EMPTY argument list is always false
    case 'or': {
      const results = (formula.arguments ?? []).map((arg) =>
        contextlessEvaluateFormula(arg.formula, ctx),
      )

      const alwaysFalsy =
        results.length === 0 ||
        results.every(
          (res) =>
            res.isStatic && res.result !== undefined && !toBoolean(res.result),
        )
      const alwaysTrue = results.some(
        (res) =>
          res.isStatic && res.result !== undefined && toBoolean(res.result),
      )

      return {
        isStatic: alwaysTrue || alwaysFalsy,
        result: alwaysFalsy ? false : alwaysTrue ? true : undefined,
      }
    }

    case 'switch': {
      for (const switchCase of formula.cases ?? []) {
        const conditionEval = contextlessEvaluateFormula(
          switchCase.condition,
          ctx,
        )
        if (!conditionEval.isStatic) {
          return {
            isStatic: false,
            result: undefined,
          }
        }
        if (conditionEval.result !== undefined) {
          if (toBoolean(conditionEval.result)) {
            return contextlessEvaluateFormula(switchCase.formula, ctx)
          }
          // Condition is static false, continue to next case
          continue
        }
        // Condition is static but value could not be computed, cannot know which branch to take
        return {
          isStatic: false,
          result: undefined,
        }
      }

      return contextlessEvaluateFormula(formula.default, ctx)
    }

    case 'path': {
      if (formula.path?.[0] === 'Args' && ctx.inFunctionScope) {
        return {
          isStatic: true,
          result: ctx.data ? applyPathFormula(formula, ctx.data) : undefined,
        }
      }

      return {
        isStatic: false,
        result: undefined,
      }
    }

    case 'function': {
      // 1. Check if it's a builtin pure lib formula
      if (!formula.package) {
        const normalizedName = normalizeFormulaName(formula.name)
        if (PURE_LIB_FORMULAS.has(normalizedName)) {
          const results = (formula.arguments ?? []).map((arg) =>
            arg.isFunction
              ? contextlessEvaluateFormula(arg.formula, {
                  ...ctx,
                  inFunctionScope: true,
                })
              : contextlessEvaluateFormula(arg.formula, ctx),
          )

          const isStatic = results.every((res) => res.isStatic)
          if (!isStatic) {
            return {
              isStatic: false,
              result: undefined,
            }
          }

          const { formulaContext, hasFailed } = createStaticFormulaContext(ctx)
          const handler = formulaContext.toddle.getFormula(formula.name)
          if (typeof handler === 'function') {
            try {
              const result = applyFormula(formula, formulaContext)
              if (!hasFailed()) {
                return {
                  isStatic: true,
                  result,
                }
              }
            } catch {
              // Ignore evaluation error and return undefined result
            }
          }

          return {
            isStatic: true,
            result: undefined,
          }
        }
      }

      // 2. Check if it references a global/project formula
      const projectFormulas = formula.package
        ? ctx.packages?.[formula.package]?.formulas
        : ctx.formulas

      const projectFormula =
        projectFormulas?.[formula.name] ??
        ctx.toddle?.getCustomFormula?.(formula.name, formula.package)

      // Only regular formulas (ToddleFormula) are supported, not real code (CodeFormula)
      if (!projectFormula || !isToddleFormula(projectFormula)) {
        return {
          isStatic: false,
          result: undefined,
        }
      }

      // Ensure all passed arguments are static
      const areArgsStatic = (formula.arguments ?? []).every((arg) =>
        arg.isFunction
          ? contextlessEvaluateFormula(arg.formula, {
              ...ctx,
              inFunctionScope: true,
            }).isStatic
          : contextlessEvaluateFormula(arg.formula, ctx).isStatic,
      )

      if (!areArgsStatic) {
        return {
          isStatic: false,
          result: undefined,
        }
      }

      // Detect circular references
      const formulaKey = `${formula.package ?? ''}:${formula.name}`
      if (ctx.visitedFormulas?.has(formulaKey)) {
        return {
          isStatic: false,
          result: undefined,
        }
      }

      const visitedFormulas = new Set(ctx.visitedFormulas)
      visitedFormulas.add(formulaKey)

      // Visit the regular project formula to ensure its body is static
      const bodyEval = contextlessEvaluateFormula(projectFormula.formula, {
        ...ctx,
        inFunctionScope: true,
        visitedFormulas,
      })

      if (!bodyEval.isStatic) {
        return {
          isStatic: false,
          result: undefined,
        }
      }

      // Try evaluating with applyFormula
      const { formulaContext, hasFailed } = createStaticFormulaContext(ctx)
      try {
        const result = applyFormula(formula, formulaContext)
        if (!hasFailed()) {
          return {
            isStatic: true,
            result,
          }
        }
      } catch {
        // Ignore evaluation error
      }

      return {
        isStatic: true,
        result: undefined,
      }
    }

    case 'apply': {
      const componentFormula = ctx.component?.formulas?.[formula.name]
      if (!componentFormula) {
        return {
          isStatic: false,
          result: undefined,
        }
      }

      // Ensure all passed arguments are static
      const areArgsStatic = (formula.arguments ?? []).every((arg) =>
        arg.isFunction
          ? contextlessEvaluateFormula(arg.formula, {
              ...ctx,
              inFunctionScope: true,
            }).isStatic
          : contextlessEvaluateFormula(arg.formula, ctx).isStatic,
      )

      if (!areArgsStatic) {
        return {
          isStatic: false,
          result: undefined,
        }
      }

      // Detect circular references
      const formulaKey = `component:${formula.name}`
      if (ctx.visitedFormulas?.has(formulaKey)) {
        return {
          isStatic: false,
          result: undefined,
        }
      }

      const visitedFormulas = new Set(ctx.visitedFormulas)
      visitedFormulas.add(formulaKey)

      // Visit component formula body to ensure it is static
      const bodyEval = contextlessEvaluateFormula(componentFormula.formula, {
        ...ctx,
        inFunctionScope: true,
        visitedFormulas,
      })

      if (!bodyEval.isStatic) {
        return {
          isStatic: false,
          result: undefined,
        }
      }

      // Try evaluating with applyFormula
      const { formulaContext, hasFailed } = createStaticFormulaContext(ctx)
      try {
        const result = applyFormula(formula, formulaContext)
        if (!hasFailed()) {
          return {
            isStatic: true,
            result,
          }
        }
      } catch {
        // Ignore evaluation error
      }

      return {
        isStatic: true,
        result: undefined,
      }
    }

    default:
      // Any other formula type is assumed non-static
      return {
        isStatic: false,
        result: undefined,
      }
  }
}

/**
 * Compresses static formulas into value formulas.
 *
 * If the formula is entirely static and its value can be evaluated,
 * it returns a `{ type: 'value', value: result }` formula.
 * Otherwise, it recursively compresses any static sub-formulas (constant folding).
 */
export const compressFormula = (
  formula: Nullable<Formula>,
  ctx: EvaluationContext,
): Nullable<Formula> => {
  if (!isFormula(formula)) {
    return formula
  }

  const evalResult = contextlessEvaluateFormula(formula, ctx)
  if (evalResult.isStatic && evalResult.result !== undefined) {
    return {
      type: 'value',
      value: evalResult.result as ValueOperation['value'],
    }
  }

  switch (formula.type) {
    case 'value':
    case 'path':
      return formula

    case 'array':
      return {
        ...formula,
        arguments: formula.arguments?.map((arg) => ({
          ...arg,
          formula: compressFormula(arg.formula, ctx) ?? arg.formula,
        })),
      }

    case 'object':
      return {
        ...formula,
        arguments: formula.arguments?.map((arg) => ({
          ...arg,
          formula: compressFormula(arg.formula, ctx) ?? arg.formula,
        })),
      }

    case 'record':
      if (Array.isArray(formula.entries)) {
        return {
          ...formula,
          entries: formula.entries.map((arg) => ({
            ...arg,
            formula: compressFormula(arg.formula, ctx) ?? arg.formula,
          })),
        }
      }
      return formula

    case 'and':
      return {
        ...formula,
        arguments: formula.arguments?.map((arg) => ({
          ...arg,
          formula: compressFormula(arg.formula, ctx) ?? arg.formula,
        })),
      }

    case 'or':
      return {
        ...formula,
        arguments: formula.arguments?.map((arg) => ({
          ...arg,
          formula: compressFormula(arg.formula, ctx) ?? arg.formula,
        })),
      }

    case 'switch': {
      const cases: NonNullable<typeof formula.cases> = []
      let defaultFormula =
        compressFormula(formula.default, ctx) ?? formula.default

      for (const switchCase of formula.cases ?? []) {
        const cond =
          compressFormula(switchCase.condition, ctx) ?? switchCase.condition
        if (cond.type === 'value') {
          if (toBoolean(cond.value)) {
            // Static truthy case: this branch will always execute
            defaultFormula =
              compressFormula(switchCase.formula, ctx) ?? switchCase.formula
            break
          }
          // Static falsy case: skip dead branch
          continue
        }
        cases.push({
          condition: cond,
          formula:
            compressFormula(switchCase.formula, ctx) ?? switchCase.formula,
        })
      }

      if (cases.length === 0) {
        return defaultFormula
      }

      return {
        ...formula,
        cases,
        default: defaultFormula,
      }
    }

    case 'function':
      return {
        ...formula,
        arguments: formula.arguments?.map((arg) => ({
          ...arg,
          formula:
            compressFormula(
              arg.formula,
              arg.isFunction ? { ...ctx, inFunctionScope: true } : ctx,
            ) ?? arg.formula,
        })),
      }

    case 'apply':
      return {
        ...formula,
        arguments: formula.arguments?.map((arg) => ({
          ...arg,
          formula:
            compressFormula(
              arg.formula,
              arg.isFunction ? { ...ctx, inFunctionScope: true } : ctx,
            ) ?? arg.formula,
        })),
      }

    default:
      return formula
  }
}
