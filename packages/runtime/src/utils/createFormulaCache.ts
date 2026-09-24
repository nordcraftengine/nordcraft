import type {
  Component,
  ComponentData,
  ComponentFormula,
} from '@nordcraft/core/dist/component/component.types'
import type {
  Formula,
  FunctionOperation,
} from '@nordcraft/core/dist/formula/formula'
import type { Nullable } from '@nordcraft/core/dist/types'
import {
  filterObject,
  get,
  mapObject,
} from '@nordcraft/core/dist/utils/collections'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { FormulaCache } from '../types'

export function createFormulaCache(component: Component): FormulaCache {
  if (!isDefined(component.formulas)) {
    return {}
  }
  return mapObject(
    filterObject<Nullable<ComponentFormula>, ComponentFormula>(
      component.formulas,
      ([_, f]) => isDefined(f),
    ),
    ([name, f]) => {
      const { canCache, keys } = f.memoize
        ? getFormulaCacheConfig(f.formula, component)
        : { canCache: false, keys: [] }
      // Only retain the values of the compared keys instead of the entire data
      // object, so the cache does not pin a full ComponentData snapshot in memory.
      // The slot array is preallocated once and reused across `set` calls to
      // avoid allocating a new array for every formula evaluation.
      const cacheInput: any[] = new Array(keys.length)
      let hasCache = false
      let cacheData: any

      return [
        name,
        {
          get: (data: ComponentData) => {
            if (
              canCache &&
              hasCache &&
              keys.every((key, i) => get(data, key) === cacheInput[i])
            ) {
              return { hit: true, data: cacheData }
            }
            return { hit: false }
          },
          set: (data: ComponentData, result: any) => {
            if (canCache) {
              for (let i = 0; i < keys.length; i++) {
                cacheInput[i] = get(data, keys[i])
              }
              hasCache = true
              cacheData = result
            }
          },
        },
      ]
    },
  )
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
