export const isDefined = <T>(value: T | undefined | null): value is T =>
  value !== null && value !== undefined

export const isObject = (
  input: unknown,
): input is Record<string, unknown> | Array<unknown> =>
  typeof input === 'object' && input !== null

export const toBoolean = (value: unknown) => value !== false && isDefined(value)
