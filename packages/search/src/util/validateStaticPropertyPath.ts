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
  options?: { allowStringIndexing?: boolean },
): { isValid: true } | { isValid: false; invalidKey: string | number } => {
  let current: unknown = data
  for (const segment of segments) {
    if (typeof current === 'string') {
      if (!options?.allowStringIndexing) {
        return { isValid: false, invalidKey: segment }
      }
      const index = Number(segment)
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= current.length ||
        String(index) !== String(segment)
      ) {
        return { isValid: false, invalidKey: segment }
      }
      current = undefined
      continue
    }
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return { isValid: false, invalidKey: segment }
    }
    const key = String(segment)
    if (!Object.prototype.hasOwnProperty.call(current, key)) {
      return { isValid: false, invalidKey: segment }
    }
    current = (current as Record<string, unknown>)[key]
  }
  return { isValid: true }
}
