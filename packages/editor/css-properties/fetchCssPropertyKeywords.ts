import { isDefined } from '@nordcraft/core/src/utils/util'
import { definitionSyntax } from 'css-tree'
import { css } from 'mdn-data'

const GLOBAL_KEYWORDS = [
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
]

// the content prop has an error in the syntax
const fixKnownSyntaxErrors = (syntax: string) =>
  syntax.replaceAll('<image ', '<image> ')

const COMMON_KEYWORDS: Record<string, string[]> = {
  display: ['block', 'inline', 'flex', 'none'],
}

const reorderKeywords = (prop: string, keywords: string[]) => {
  const sorting = COMMON_KEYWORDS[prop]

  if (isDefined(sorting)) {
    return [
      ...keywords.filter((keyword) => sorting.includes(keyword)),
      ...keywords.filter((keyword) => !sorting.includes(keyword)),
    ]
  }

  return keywords
}

/**
 * Generates a JSON map of all CSS properties → supported keyword values,
 * including global CSS keywords (inherit, initial, unset, revert, revert-layer).
 *
 * Uses MDN data. MDN data is in the process of being deprecated in favor of w3c/webref.
 * I made an attempt at using the data on w3c/webref, but there are currently too many issues (as of 30/10/2025).
 */
export function getCssKeywordsMap() {
  const { properties, syntaxes } = css

  try {
    const recursiveWalk = (syntax: string, keywords: Set<string>) => {
      definitionSyntax.walk(
        definitionSyntax.parse(fixKnownSyntaxErrors(syntax)),

        (node) => {
          if (
            node.type === 'Type' &&
            // exclude functions
            !node.name.includes('()') &&
            // exclude named colors
            !node.name.includes('color')
          ) {
            const type = syntaxes[node.name]

            if (type) {
              recursiveWalk(type.syntax, keywords)
            }
          }

          if (node.type === 'Keyword') {
            keywords.add(node.name)
          }
        },
      )
    }

    return Object.entries(properties).reduce((result, [name, data]) => {
      const keywordSet: Set<string> = new Set()

      if (data.syntax) {
        recursiveWalk(data.syntax, keywordSet)
      }

      return {
        ...result,
        [name]: reorderKeywords(
          name,
          Array.from(keywordSet).concat(GLOBAL_KEYWORDS),
        ),
      }
    }, {})
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  }
}
