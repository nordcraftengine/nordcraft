/**
 * Removes non-alphanumeric characters except for _ from a function name
 * @param name
 * @returns "safe" function name only containing alphanumeric characters and _, e.g. "myFunction" or "my_function"
 */
export const safeFunctionName = (name: string) => {
  return (
    name
      // Remove any non-alphanumeric characters
      .replaceAll(/[^a-zA-Z0-9_]/g, '')
      // Remove any leading numbers
      .replace(/^[0-9]+/, '')
  )
}
