import { type Formula } from '@nordcraft/core/dist/formula/formula'
import type { Nullable } from '@nordcraft/core/dist/types'

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
      const results = formula.arguments.map((arg) =>
        contextlessEvaluateFormula(arg.formula),
      )

      return {
        isStatic: results.every((res) => res.isStatic),
        result: results.map((res) => res.result),
      }
    }

    case 'record': {
      const entries = Object.entries(formula.entries).map(
        ([key, arg]) => [key, contextlessEvaluateFormula(arg.formula)] as const,
      )

      const results = entries.map(([, res]) => res)

      return {
        isStatic: results.every((res) => res.isStatic),
        result: Object.fromEntries(
          entries.map(([key, res]) => [key, res.result]),
        ),
      }
    }

    // Static if:
    // - ALL conditions are static AND truthy
    // - ANY condition is static and falsy
    // - EMPTY argument list is always true
    case 'and': {
      const results = formula.arguments.map((arg) =>
        contextlessEvaluateFormula(arg.formula),
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
      const results = formula.arguments.map((arg) =>
        contextlessEvaluateFormula(arg.formula),
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

    default:
      // For now, we assume that any other formula is not static.
      return {
        isStatic: false,
        result: undefined,
      }
  }
}
