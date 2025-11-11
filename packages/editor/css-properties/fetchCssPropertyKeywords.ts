import { definitionSyntax } from 'css-tree'
import { css } from 'mdn-data'
import { keywordDescriptionsByProperty } from './keywordDescriptionsByProperty'

const GLOBAL_KEYWORDS = [
  {
    value: 'inherit',
    description: 'Uses the computed value from the parent element.',
  },
  {
    value: 'initial',
    description: 'Uses the property\u2019s initial value.',
  },
  {
    value: 'unset',
    description:
      'Resets the property to inherited or initial depending on context.',
  },
  {
    value: 'revert',
    description:
      'Reverts to the value established by the user-agent stylesheet or previous cascade origin.',
  },
  {
    value: 'revert-layer',
    description:
      'Reverts the property to the value from a previous cascade layer.',
  },
]

// the content prop has an error in the syntax
const fixKnownSyntaxErrors = (syntax: string) =>
  syntax.replaceAll('<image ', '<image> ')

const COMMON_KEYWORDS: Partial<Record<string, string[]>> = {
  display: ['block', 'inline', 'flex', 'none'],
}

const reorderKeywords = (prop: string, keywords: ProcessedKeywords) => {
  const sorting = COMMON_KEYWORDS[prop]

  if (sorting) {
    return [
      ...Object.keys(keywords).filter((keyword) => sorting.includes(keyword)),
      ...Object.keys(keywords).filter((keyword) => !sorting.includes(keyword)),
    ]
  }

  return keywords
}

type ProcessedKeywords = Array<Record<string, string | undefined>>

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
    const recursiveWalk = (
      syntax: string,
      keywords: ProcessedKeywords,
      property: string,
    ) => {
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
              recursiveWalk(type.syntax, keywords, property)
            }
          }

          if (
            node.type === 'Keyword' &&
            keywords.findIndex((keyword) => keyword.value === node.name) === -1
          ) {
            keywords.push({
              value: node.name,
              description: keywordDescriptionsByProperty[property]?.[node.name],
            })
          }
        },
      )
    }

    return Object.entries(properties).reduce((result, [name, data]) => {
      const processedKeywords: ProcessedKeywords = []

      if (data.syntax) {
        recursiveWalk(data.syntax, processedKeywords, name)
      }

      return {
        ...result,
        [name]: reorderKeywords(
          name,
          processedKeywords.concat(GLOBAL_KEYWORDS),
        ),
      }
    }, {})
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  }
}
