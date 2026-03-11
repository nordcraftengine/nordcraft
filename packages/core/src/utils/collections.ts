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
    const entry = f([key, object[key] as T])
    result[entry[0]] = entry[1]
  }
  return result
}

export const mapValues = <T, T2>(
  object: Record<string, T>,
  f: (value: T) => T2,
): Record<string, T2> => {
  const result: Record<string, T2> = {}
  for (const key in object) {
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
  path: Array<string | number>,
): T => {
  if (path.length === 0) {
    return collection
  }
  return _omit(collection, path, 0)
}

const _omit = <T = object>(
  collection: T,
  path: Array<string | number>,
  index: number,
): T => {
  const key = path[index]
  const isLast = index === path.length - 1

  if (!isLast) {
    const clone: any = Array.isArray(collection)
      ? [...collection]
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

export const omitKeys = <T extends Record<string, any>>(
  object: T,
  keys: Array<keyof T>,
): T => {
  const result = { ...object }
  for (let i = 0; i < keys.length; i++) {
    delete result[keys[i]!]
  }
  return result
}

export const omitPaths = (object: Record<string, any>, keys: string[][]) => {
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
    if (result[key]) {
      result[key].push(item)
    } else {
      result[key] = [item]
    }
  }
  return result
}

export const filterObject = <T>(
  object: Record<string, T>,
  f: (kv: [string, T]) => boolean,
): Record<string, T> => {
  const result: Record<string, T> = {}
  for (const key in object) {
    const value = object[key]!
    if (f([key, value])) {
      result[key] = value
    }
  }
  return result
}

export function get<T = any>(
  collection: T,
  [head, ...rest]: Array<string | number>,
): any {
  const headItem = isDefined(head) ? (collection as any)?.[head] : undefined
  if (rest.length === 0) {
    return headItem
  }
  return get(headItem, rest)
}

export const set = <T = unknown>(
  collection: T,
  key: Array<string | number>,
  value: any,
): T => {
  if (key.length === 0) {
    return collection
  }
  return _set(collection, key, 0, value)
}

const _set = <T = unknown>(
  collection: T,
  path: Array<string | number>,
  index: number,
  value: any,
  // eslint-disable-next-line max-params
): T => {
  const head = path[index]
  const isLast = index === path.length - 1

  const clone: any = Array.isArray(collection)
    ? [...collection]
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
