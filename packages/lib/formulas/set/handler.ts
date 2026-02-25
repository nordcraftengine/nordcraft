import type { FormulaHandler } from '@nordcraft/core/dist/types'
import { isObject } from '@nordcraft/core/dist/utils/util'

const handler: FormulaHandler<Array<unknown> | Record<string, unknown>> = (
  [collection, key, value],
  ctx,
): any => {
  if (
    typeof key !== 'string' &&
    typeof key !== 'number' &&
    !Array.isArray(key)
  ) {
    return null
  }

  if (Array.isArray(key)) {
    return _set(collection, key, 0, value, ctx)
  }

  return _set(collection, [key], 0, value, ctx)
}

function _set(
  collection: any,
  path: unknown[],
  index: number,
  value: any,
  ctx: any,
): any {
  const head = String(path[index])
  const isLast = index === path.length - 1

  if (!isObject(collection)) {
    return null
  }

  const clone: Record<string, any> = Array.isArray(collection)
    ? [...collection]
    : { ...collection }

  if (isLast) {
    clone[head] = value
  } else {
    clone[head] = _set(clone[head], path, index + 1, value, ctx)
  }

  return clone
}
export default handler
