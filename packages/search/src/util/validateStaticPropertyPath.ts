import type { FunctionArgument } from '@nordcraft/core/dist/formula/formula'

export const getArgumentFormula = (
  args: FunctionArgument[] | undefined | null,
  name: string,
  index: number,
) => args?.find((arg) => arg.name === name)?.formula ?? args?.[index]?.formula

export const normalizePathSegments = (
  path: unknown,
): (string | number)[] | undefined => {
  if (typeof path === 'string' || typeof path === 'number') {
    return [path]
  }
  if (Array.isArray(path)) {
    return path
  }
  return undefined
}

export const validateStaticPath = (
  data: unknown,
  segments: (string | number)[],
): { isValid: true } | { isValid: false; invalidKey: string | number } => {
  let current: unknown = data
  for (const segment of segments) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return { isValid: false, invalidKey: segment }
    }
    if (Array.isArray(current)) {
      const index = typeof segment === 'number' ? segment : Number(segment)
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= current.length ||
        (typeof segment === 'string' && !/^\d+$/.test(segment))
      ) {
        return { isValid: false, invalidKey: segment }
      }
      current = current[index]
    } else {
      const key = String(segment)
      if (!Object.prototype.hasOwnProperty.call(current, key)) {
        return { isValid: false, invalidKey: segment }
      }
      current = (current as Record<string, unknown>)[key]
    }
  }
  return { isValid: true }
}
