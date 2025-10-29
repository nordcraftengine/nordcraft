const CSS_DATA_URL =
  'https://raw.githubusercontent.com/w3c/webref/refs/heads/main/ed/css/CSS.json'
const GLOBAL_KEYWORDS = [
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
]

/**
 * Generates a JSON map of all CSS properties → supported keyword values,
 * including global CSS keywords (inherit, initial, unset, revert, revert-layer).
 *
 * Uses MDN data from https://github.com/w3c/webref.
 */
export async function getCssKeywordsMap() {
  try {
    const res = await fetch(CSS_DATA_URL)
    const data = await res.json()

    return data.properties.reduce((result, { name, values }) => {
      const keywords = values
        ? values
            .reduce((valueResult, { name }) => {
              if (name && /^[a-z-]+$/i.test(name)) {
                return [...valueResult, name]
              }

              return valueResult
            }, [])
            .concat(GLOBAL_KEYWORDS)
        : []

      if (keywords.length > 0) {
        return { ...result, [name]: keywords }
      }

      return result
    }, {})
  } catch (error) {
    console.error(error)
  }
}
