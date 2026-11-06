export const isDefined = <T>(value: T | undefined | null): value is T =>
  value !== null && value !== undefined

export const isObject = (
  input: any,
): input is Record<string, any> | Array<any> =>
  typeof input === 'object' && input !== null

export const toBoolean = (value: any) =>
  value !== false && value !== undefined && value !== null
