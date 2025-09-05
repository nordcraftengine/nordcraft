export const isCssPropertyNameValid = (property: string) => {
  // This regex checks for valid CSS property names, including vendor prefixes
  // and allows for hyphenated names.
  // It does not allow spaces or invalid characters.
  const cssPropertyNameRegex = /^-?[a-zA-Z][a-zA-Z0-9-]*$/
  return cssPropertyNameRegex.test(property)
}

// export const isCssValueValid = (value: string) => {
//   const cssValueRegex =
