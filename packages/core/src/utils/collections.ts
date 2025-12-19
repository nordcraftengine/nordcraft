import type { Nullable } from '../types'
import { isDefined } from './util'

export const isObject = (input: any): input is Record<string, any> =>
  typeof input === 'object' && input !== null

export const mapObject = <T, T2>(
  object: Record<string, T>,
  f: (kv: [string, T]) => [string, T2],
): Record<string, T2> => Object.fromEntries(Object.entries(object).map(f))

export const mapValues = <T, T2>(
  object: Record<string, T>,
  f: (value: T) => T2,
): Record<string, T2> => mapObject(object, ([key, value]) => [key, f(value)])

/**
 * Deletes potentially nested keys from an object
 * @param collection Array or Object
 * @param path Path to the key to delete. For instance ['foo', 0, 'bar']
 * @returns The updated object/array
 */
export const omit = <T = object>(
  collection: T,
  [key, ...rest]: Array<string | number>,
): T => {
  if (rest.length > 0) {
    const clone: any = Array.isArray(collection)
      ? [...collection]
      : { ...collection }
    if (isDefined(key)) {
      clone[key] = omit(clone[key], rest)
    }
    return clone
  }

  if (Array.isArray(collection)) {
    return collection.toSpliced(Number(key), 1) as T
  }

  const clone: any = { ...collection }
  if (isDefined(key)) {
    delete clone[key]
  }
  return clone
}

export const omitKeys = <T extends Record<string, any>>(
  object: T,
  keys: Array<keyof T>,
): T =>
  Object.fromEntries(
    Object.entries(object).filter(([k]) => !keys.includes(k)),
  ) as T

export const omitPaths = (object: Record<string, any>, keys: string[][]) =>
  keys.reduce((acc, key) => omit(acc, key), { ...object })

export const groupBy = <T>(items: T[], f: (t: T) => string) =>
  items.reduce<Record<string, T[]>>((acc, item) => {
    const key = f(item)
    acc[key] = acc[key] ?? []
    acc[key].push(item)
    return acc
  }, {})

export const filterObject = <T>(
  object: Record<string, T>,
  f: (kv: [string, T]) => boolean,
): Record<string, T> => Object.fromEntries(Object.entries(object).filter(f))

export function get<T = any>(collection: T, [head, ...rest]: string[]): any {
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
  const [head, ...rest] = key

  const clone: any = Array.isArray(collection)
    ? [...collection]
    : isObject(collection)
      ? { ...collection }
      : {}

  // Cast to any, since it's actually possible to set a property with an undefined key on an object in Javascript
  // and we don't want to introduce a breaking change
  clone[head as any] =
    rest.length === 0 ? value : set(clone[head as any], rest, value)
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
