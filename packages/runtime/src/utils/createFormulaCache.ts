import type {
  Component,
  ComponentData,
  Formula,
  FunctionOperation,
} from '@nordcraft/core'
import { get, isDefined } from '@nordcraft/core'
import type { FormulaCache } from '../types'

// Components without memoized formulas can share this empty cache. The object
// itself is never written to (only the per-formula entries returned by `get`).
const EMPTY_FORMULA_CACHE: FormulaCache = Object.create(null)

export function createFormulaCache(component: Component): FormulaCache {
  if (!isDefined(component.formulas)) {
    return EMPTY_FORMULA_CACHE
  }
  let cache: FormulaCache | undefined
  const formulas = component.formulas
  for (const name in formulas) {
    const f = formulas[name]
    if (!f?.memoize) {
      continue
    }
    const { canCache, keys } = getFormulaCacheConfig(f.formula, component)
    if (!canCache) {
      continue
    }
    cache ??= Object.create(null) as FormulaCache
    let cacheInput: any
    let cacheData: any

    cache[name] = {
      get: (data: ComponentData) => {
        if (
          cacheInput &&
          keys.every((key) => {
            return get(data, key) === get(cacheInput, key)
          })
        ) {
          return { hit: true, data: cacheData }
        }
        return { hit: false }
      },
      set: (data: ComponentData, result: any) => {
        cacheInput = data
        cacheData = result
      },
    }
  }
  return cache ?? EMPTY_FORMULA_CACHE
}

function getFormulaCacheConfig(formula: Formula, component: Component) {
  const paths: Array<string | number>[] = []
  function visitOperation(op: Formula) {
    if (!op) {
      return
    }
    if (op.type === 'path' && op.path[0] !== 'Args') {
      paths.push(op.path)
    }
    if (Array.isArray((op as any)?.arguments)) {
      ;(op as FunctionOperation)?.arguments?.forEach((arg) =>
        visitOperation(arg.formula),
      )
    }
    if (op.type === 'record' && Array.isArray(op.entries)) {
      op.entries.forEach((arg) => visitOperation(arg.formula))
    }

    if (op.type === 'apply') {
      const formula = component.formulas?.[op.name]
      if (!formula) {
        return {
          canCache: false,
          keys: [],
        }
      }
      if (!formula.memoize) {
        throw new Error('Cannot memoize')
      }
      visitOperation(formula.formula)
    }
  }
  try {
    visitOperation(formula)
  } catch {
    return {
      canCache: false,
      keys: [],
    }
  }

  const keys: Array<string | number>[] = []
  paths
    .sort((a, b) => a.length - b.length)
    .forEach((path) => {
      if (!keys.some((key) => key.every((k, i) => k === path[i]))) {
        keys.push(path)
      }
    })
  return {
    canCache: true,
    keys,
  }
}
