import type { Nullable } from '../types'
import { isDefined } from './util'

export const isObject = (input: any): input is Record<string, any> =>
  typeof input === 'object' && input !== null

export const mapObject = <T, T2>(
  object: Record<string, T>,
  f: (kv: [string, T]) => [string, T2],
): Record<string, T2> => {
  const keys = Object.keys(object)
  const result: Record<string, T2> = {}
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!
    const entry = f([key, object[key] as T])
    result[entry[0]] = entry[1]
  }
  return result
}

export const mapValues = <T, T2>(
  object: Record<string, T>,
  f: (value: T) => T2,
): Record<string, T2> => {
  const keys = Object.keys(object)
  const result: Record<string, T2> = {}
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!
    result[key] = f(object[key] as T)
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
  if (path.length === 0) {
    return collection
  }
  return _omit(collection, path, 0)
}

const _omit = <T = object>(
  collection: T,
  path: Array<PropertyKey>,
  index: number,
): T => {
  const key = path[index]
  const isLast = index === path.length - 1

  if (!isLast) {
    const clone: any = Array.isArray(collection)
      ? (collection as any[]).slice()
      : isObject(collection)
        ? { ...collection }
        : {}

    if (isDefined(key)) {
      clone[key] = _omit(clone[key], path, index + 1)
    }
    return clone
  }

  if (Array.isArray(collection)) {
    return (collection as any[]).toSpliced(Number(key), 1) as T
  }

  const clone: any = isObject(collection) ? { ...collection } : {}
  if (isDefined(key)) {
    delete clone[key]
  }
  return clone as T
}

// Avoids the `delete` operator, which can force V8 to put an object into
// "dictionary mode" and de-optimize property access. Instead we build the
// result by copying only the keys we want to keep, using a Set for O(1)
// membership checks.
export const omitKeys = <T extends Record<string, any>>(
  object: T,
  keys: Array<keyof T>,
): T => {
  if (keys.length === 0) {
    return { ...object }
  }
  const omitSet = new Set<keyof T>(keys)
  const objectKeys = Object.keys(object) as Array<keyof T>
  const result = {} as T
  for (let i = 0; i < objectKeys.length; i++) {
    const key = objectKeys[i]!
    if (!omitSet.has(key)) {
      result[key] = object[key]
    }
  }
  return result
}

// This adds type safety to the omitPaths function, ensuring that the first key in the path is a valid key of the object, while the rest of the keys can be any property key. Empty paths are also allowed.
type ValidPath<T> = [] | [keyof T, ...PropertyKey[]]
export const omitPaths = <T extends Record<string, any>>(
  object: T,
  keys: Array<ValidPath<T>>,
): T => {
  let result = object
  for (let i = 0; i < keys.length; i++) {
    result = omit(result, keys[i]!)
  }
  return result
}

export const groupBy = <T>(items: T[], f: (t: T) => string) => {
  const result: Record<string, T[]> = {}
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!
    const key = f(item)
    const bucket = result[key]
    if (bucket) {
      bucket.push(item)
    } else {
      result[key] = [item]
    }
  }
  return result
}

export const filterObject = <T, T2 extends T = T>(
  object: Record<string, T>,
  f: (kv: [string, T]) => boolean,
): Record<string, T2> => {
  const keys = Object.keys(object)
  const result: Record<string, T2> = {}
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!
    const value = object[key]!
    if (f([key, value])) {
      result[key] = value as unknown as T2
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
  if (path.length === 0) {
    return collection
  }
  return _set(collection, path, 0, value)
}

const _set = <T = unknown>(
  collection: T,
  path: Array<PropertyKey>,
  index: number,
  value: any,
  // eslint-disable-next-line max-params
): T => {
  const head = path[index]
  const isLast = index === path.length - 1

  const clone: any = Array.isArray(collection)
    ? (collection as any[]).slice()
    : isObject(collection)
      ? { ...collection }
      : {}

  // Cast to any, since it's actually possible to set a property with an undefined key on an object in Javascript
  // and we don't want to introduce a breaking change
  clone[head as any] = isLast
    ? value
    : _set(clone[head as any], path, index + 1, value)
  return clone as T
}

export const sortObjectEntries = <T>(
  object: Record<string, T>,
  f: (kv: [string, T]) => string | number | boolean,
  ascending = true,
): [string, T][] => easySort(Object.entries(object), f, ascending)

// Uses a Schwartzian transform (decorate-sort-undecorate): the sort key is
// computed exactly once per item up front, instead of being recomputed by
// `f` on every comparison during the O(n log n) sort. This matters most
// when `f` is non-trivial (property lookups, parsing, etc.).
export const easySort = <T>(
  collection: T[],
  f: (item: T) => string | number | boolean,
  ascending = true,
): T[] => {
  const len = collection.length
  const decorated: [string | number | boolean, T][] = new Array(len)
  for (let i = 0; i < len; i++) {
    const item = collection[i] as T
    decorated[i] = [f(item), item]
  }

  decorated.sort((a, b) => {
    const keyA = a[0]
    const keyB = b[0]
    if (keyA === keyB) {
      return 0
    }
    return (keyA > keyB ? 1 : -1) * (ascending ? 1 : -1)
  })

  const result: T[] = new Array(len)
  for (let i = 0; i < len; i++) {
    result[i] = decorated[i]![1]
  }
  return result
}

export const deepSortObject = (
  obj: any,
): Nullable<Record<string, any> | Array<any>> => {
  if (!isDefined(obj)) {
    return obj
  }
  if (Array.isArray(obj)) {
    const len = obj.length
    const result = new Array(len)
    for (let i = 0; i < len; i++) {
      result[i] = deepSortObject(obj[i])
    }
    return result
  } else if (typeof obj === 'object') {
    const keys = Object.keys(obj)
    if (keys.length === 0) {
      return obj
    }
    keys.sort()
    const result: Record<string, any> = {}
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!
      result[key] = deepSortObject(obj[key])
    }
    return result
  }
  return obj
}
