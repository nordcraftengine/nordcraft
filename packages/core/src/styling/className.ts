import { generateAlphabeticName, hash } from './hash'

// Classnames are reused a lot, and JS hashing is expensive, so there is benefit in caching them in a native hashmap.
const CLASSNAME_LOOKUP = new Map<string, string>()
export const getClassName = (object: any) => {
  const stringified = JSON.stringify(object)
  if (CLASSNAME_LOOKUP.has(stringified)) {
    return CLASSNAME_LOOKUP.get(stringified)!
  }
  const className = generateAlphabeticName(hash(stringified))
  CLASSNAME_LOOKUP.set(stringified, className)
  return className
}

export const toValidClassName = (
  input: string,
  escapeSpecialCharacters = false,
) => {
  // Replace invalid characters with hyphens
  let className = input
    // Remove leading and trailing whitespace
    .trim()
    // Replace whitespace with hyphens
    .replace(/\s+/g, '-')

  if (escapeSpecialCharacters) {
    className = className.replace(/[^a-zA-Z0-9-_]/g, (match) => `\\${match}`)
  }

  // Ensure the class name doesn't start with a number or special character
  if (/^[^a-zA-Z]/.test(className)) {
    className = `_${className}`
  }

  return className
}
