export const parseBenchmarkArgs = (argv: readonly string[]) => {
  const args = new Map<string, string>()
  for (const arg of argv) {
    const separator = arg.indexOf('=')
    if (separator === -1) {
      args.set(arg, 'true')
    } else {
      args.set(arg.slice(0, separator), arg.slice(separator + 1))
    }
  }
  return args
}

export const getOptionalString = (
  args: ReadonlyMap<string, string>,
  name: string,
) => {
  const value = args.get(name)
  return value === undefined || value.length === 0 ? undefined : value
}

export const getNumber = (
  args: ReadonlyMap<string, string>,
  name: string,
  defaultValue: number,
) => {
  const rawValue = args.get(name)
  if (rawValue === '') {
    throw new Error(`${name} must be a number`)
  }
  const value = Number(rawValue ?? defaultValue)
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a number`)
  }
  return value
}

export const getNonNegativeNumber = (
  args: ReadonlyMap<string, string>,
  name: string,
  defaultValue: number,
) => {
  const value = getNumber(args, name, defaultValue)
  if (value < 0) {
    throw new Error(`${name} must not be negative`)
  }
  return value
}

export const getPositiveInteger = (
  args: ReadonlyMap<string, string>,
  name: string,
  defaultValue: number,
) => {
  const value = getNumber(args, name, defaultValue)
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`)
  }
  return value
}

export const getNonNegativeInteger = (
  args: ReadonlyMap<string, string>,
  name: string,
  defaultValue: number,
) => {
  const value = getNumber(args, name, defaultValue)
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`)
  }
  return value
}

export const getBoolean = (
  args: ReadonlyMap<string, string>,
  name: string,
  defaultValue: boolean,
) => {
  const value = args.get(name) ?? String(defaultValue)
  if (value !== 'true' && value !== 'false') {
    throw new Error(`${name} must be true or false`)
  }
  return value === 'true'
}
