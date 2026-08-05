import type { Nullable } from '../types'
import { isDefined } from './util'

export const isObject = (input: any): input is Record<string, any> =>
  typeof input === 'object' && input !== null

export const mapObject = <T, T2>(
  object: Record<string, T>,
  f: (kv: [string, T]) => [string, T2],
): Record<string, T2> => {
  const result: Record<string, T2> = {}
  for (const key in object) {
    const v = object[key] as T
    const [k, mappedV] = f([key, v])
    result[k] = mappedV
  }
  return result
}

export const mapValues = <T, T2>(
  object: Record<string, T>,
  f: (value: T) => T2,
): Record<string, T2> => {
  const result = {} as Record<string, T2>
  for (const k in object) {
    result[k] = f(object[k] as T)
  }
  return result
}

/**
 * Deletes potentially nested keys from an object
 * @param collection Array or Object
 * @param path Path to the key to delete. For instance ['foo', 0, 'bar']
 * @returns The updated object/array
 */
export const omit = <T = object>(
  collection: T,
  path: Array<PropertyKey>,
): T => {
  const omitInternal = (coll: any, index: number): any => {
    const key = path[index] as PropertyKey
    if (index < path.length - 1) {
      const clone = Array.isArray(coll) ? [...coll] : { ...coll }
      clone[key] = omitInternal(clone[key], index + 1)
      return clone
    }

    if (Array.isArray(coll)) {
      const arrClone = [...coll]
      arrClone.splice(Number(key), 1)
      return arrClone
    }

    const clone = { ...coll }
    delete clone[key]
    return clone
  }
  if (path.length === 0) return collection
  return omitInternal(collection, 0)
}

export const omitKeys = <T extends Record<string, any>>(
  object: T,
  keys: Array<keyof T>,
): T => {
  const result = { ...object }
  const len = keys.length
  for (let i = 0; i < len; i++) {
    const key = keys[i] as keyof T
    delete result[key]
  }
  return result
}

// This adds type safety to the omitPaths function, ensuring that the first key in the path is a valid key of the object, while the rest of the keys can be any property key. Empty paths are also allowed.
type ValidPath<T> = [] | [keyof T, ...PropertyKey[]]
export const omitPaths = <T extends Record<string, any>>(
  object: T,
  keys: Array<ValidPath<T>>,
): T => keys.reduce((acc, key) => omit(acc, key), { ...object })

export const groupBy = <T>(items: T[], f: (t: T) => string) => {
  const result: Record<string, T[] | undefined> = Object.create(null)
  const len = items.length
  for (let i = 0; i < len; i++) {
    const item = items[i] as T
    const key = f(item)
    const existing = result[key]
    if (existing === undefined) {
      result[key] = [item]
    } else {
      existing.push(item)
    }
  }
  return result as Record<string, T[]>
}

export const filterObject = <T, T2 extends T = T>(
  object: Record<string, T>,
  f: (kv: [string, T]) => boolean,
): Record<string, T2> => {
  const result = {} as Record<string, T2>
  for (const k in object) {
    const v = object[k] as T
    if (f([k, v])) {
      result[k] = v as unknown as T2
    }
  }
  return result
}

export function get<T = any>(collection: T, path: Array<PropertyKey>): any {
  let current: any = collection
  const len = path.length
  for (let i = 0; i < len; i++) {
    const key = path[i] as PropertyKey
    if (current === undefined || current === null) {
      return undefined
    }
    current = current[key]
  }

  return current
}

export const set = <T = unknown>(
  collection: T,
  path: Array<PropertyKey>,
  value: any,
): T => {
  const len = path.length
  if (len === 0) return collection

  const recurse = (current: any, index: number): any => {
    const head = path[index]
    const clone: any = Array.isArray(current)
      ? [...current]
      : isObject(current)
        ? { ...current }
        : {}

    if (index === len - 1) {
      clone[head as any] = value
      return clone
    }

    clone[head as any] = recurse(clone[head as any], index + 1)
    return clone
  }

  return recurse(collection, 0) as T
}

export const sortObjectEntries = <T>(
  object: Record<string, T>,
  f: (kv: [string, T]) => string | number | boolean,
  ascending = true,
): [string, T][] => easySort(Object.entries(object), f, ascending)

export const easySort = <T>(
  collection: T[],
  f: (item: T) => string | number | boolean,
  ascending = true,
) =>
  [...collection].sort((a, b) => {
    const keyA = f(a)
    const keyB = f(b)
    if (keyA === keyB) {
      return 0
    }
    return (keyA > keyB ? 1 : -1) * (ascending ? 1 : -1)
  })

export const deepSortObject = (
  obj: any,
): Nullable<Record<string, any> | Array<any>> => {
  if (!isDefined(obj)) {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map((val) => deepSortObject(val))
  } else if (typeof obj === 'object' && Object.keys(obj).length > 0) {
    return [...Object.keys(obj)].sort().reduce<any>((acc, key) => {
      acc[key] = deepSortObject(obj[key])
      return acc
    }, {})
  }
  return obj
}
