import { generateAlphabeticName, hash } from './hash'

export const getClassName = (object: any) => {
  return generateAlphabeticName(hash(JSON.stringify(object)))
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
