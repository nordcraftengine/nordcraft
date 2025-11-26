import type {
  Component,
  ComponentData,
} from '@nordcraft/core/dist/component/component.types'
import type {
  Formula,
  FunctionOperation,
} from '@nordcraft/core/dist/formula/formula'
import { get, mapObject } from '@nordcraft/core/dist/utils/collections'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { FormulaCache } from '../types'

export function createFormulaCache(component: Component): FormulaCache {
  if (!isDefined(component.formulas)) {
    return {}
  }
  return mapObject(component.formulas, ([name, f]) => {
    const { canCache, keys } = f.memoize
      ? getFormulaCacheConfig(f.formula, component)
      : { canCache: false, keys: [] }
    let cacheInput: any
    let cacheData: any

    return [
      name,
      {
        get: (data: ComponentData) => {
          if (
            canCache &&
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
          if (canCache) {
            cacheInput = data
            cacheData = result
          }
        },
      },
    ]
  })
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
      ;(op as FunctionOperation)?.arguments.forEach((arg) =>
        visitOperation(arg.formula),
      )
    }
    if (op.type === 'record' && Array.isArray(op.entries)) {
      op.entries.forEach((arg) => visitOperation(arg.formula))
    }

    if (op.type === 'apply') {
      if (!component.formulas?.[op.name]?.memoize) {
        throw new Error('Cannot memoize')
      }
      visitOperation(component.formulas?.[op.name]?.formula)
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
