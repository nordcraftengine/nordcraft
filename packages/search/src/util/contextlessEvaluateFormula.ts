import {
  isToddleFormula,
  type Formula,
} from '@nordcraft/core/dist/formula/formula'
import type { PluginFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import type { Nullable } from '@nordcraft/core/dist/types'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'

const PURE_LIB_FORMULAS = new Set([
  // Arithmetic & Math
  'absolute',
  'add',
  'clamp',
  'divide',
  'logarithm',
  'max',
  'min',
  'minus',
  'modulo',
  'multiply',
  'number',
  'power',
  'round',
  'roundDown',
  'roundUp',
  'squareRoot',
  'sum',

  // Logic & Comparison
  'boolean',
  'equals',
  'greaterOrEqueal',
  'greaterThan',
  'lessOrEqual',
  'lessThan',
  'not',
  'notEqual',

  // Strings
  'capitalize',
  'concatenate',
  'decodeBase64',
  'decodeURIComponent',
  'encodeBase64',
  'encodeJSON',
  'encodeURIComponent',
  'json',
  'lowercase',
  'matches',
  'parseJSON',
  'parseURL',
  'replaceAll',
  'split',
  'startsWith',
  'string',
  'trim',
  'uppercase',

  // Collections
  'append',
  'defaultTo',
  'deleteKey',
  'drop',
  'dropLast',
  'entries',
  'first',
  'flatten',
  'fromEntries',
  'get',
  'includes',
  'indexOf',
  'join',
  'last',
  'lastIndexOf',
  'prepend',
  'reverse',
  'set',
  'size',
  'take',
  'takeLast',
  'typeOf',
  'unique',

  // Higher-order (with callback formulas)
  'every',
  'filter',
  'find',
  'findIndex',
  'findLast',
  'groupBy',
  'keyBy',
  'map',
  'reduce',
  'some',
  'sort_by',

  // Deterministic Date
  'dateFromString',
  'dateFromTimestamp',
  'formatDate',
  'timestamp',
])

const normalizeFormulaName = (name: string) =>
  name.startsWith('@toddle/') ? name.slice(8) : name

export interface EvaluationContext {
  inFunctionScope?: boolean
  formulas?: Record<string, PluginFormula>
  packages?: Partial<
    Record<string, { formulas?: Record<string, PluginFormula> }>
  >
  files?: Pick<ProjectFiles, 'formulas' | 'packages'>
  visitedFormulas?: Set<string>
}

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
 *
 * TODO: Make this function more capable of evaluating pure core formulas.
 * TODO: Memoize the results (using path or a fast hash) to avoid re-evaluating any similar sub-graphs multiple times.
 * TODO: Add a complex test-suite to ensure it works and develops as expected.
 */
export const contextlessEvaluateFormula = (
  formula?: Nullable<Formula>,
  ctx?: EvaluationContext,
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
  // Very basic implementation, just to get started.
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

        return {
          isStatic: entries.every(([, res]) => res.isStatic),
          result: Object.fromEntries(
            entries.map(([key, res]) => [key, res.result]),
          ),
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
        results.every((res) => res.isStatic && Boolean(res.result) === true)
      const alwaysFalsy = results.some(
        (res) => res.isStatic && Boolean(res.result) === false,
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
        results.every((res) => res.isStatic && Boolean(res.result) === false)
      const alwaysTrue = results.some(
        (res) => res.isStatic && Boolean(res.result) === true,
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
        if (conditionEval.result) {
          return contextlessEvaluateFormula(switchCase.formula, ctx)
        }
      }

      return contextlessEvaluateFormula(formula.default, ctx)
    }

    case 'path': {
      if (formula.path?.[0] === 'Args' && ctx?.inFunctionScope) {
        return {
          isStatic: true,
          result: undefined,
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

          return {
            isStatic: results.every((res) => res.isStatic),
            result: undefined,
          }
        }
      }

      // 2. Check if it references a global/project formula
      const projectFormulas = formula.package
        ? (ctx?.packages?.[formula.package]?.formulas ??
          ctx?.files?.packages?.[formula.package]?.formulas)
        : (ctx?.formulas ?? ctx?.files?.formulas)

      const projectFormula = projectFormulas?.[formula.name]

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
      if (ctx?.visitedFormulas?.has(formulaKey)) {
        return {
          isStatic: false,
          result: undefined,
        }
      }

      const visitedFormulas = new Set(ctx?.visitedFormulas)
      visitedFormulas.add(formulaKey)

      // Visit and evaluate the regular project formula
      return contextlessEvaluateFormula(projectFormula.formula, {
        ...ctx,
        inFunctionScope: true,
        visitedFormulas,
      })
    }

    default:
      // For now, we assume that any other formula is not static.
      return {
        isStatic: false,
        result: undefined,
      }
  }
}
