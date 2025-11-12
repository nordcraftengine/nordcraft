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
    description: "Uses the property's initial value.",
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
      ...Object.values(keywords).filter((keyword) =>
        sorting.includes(keyword.value),
      ),
      ...Object.values(keywords).filter(
        (keyword) => !sorting.includes(keyword.value),
      ),
    ]
  }

  return keywords
}

type ProcessedKeywords = Array<{ value: string; description?: string }>

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
    const recursiveWalk = ({
      syntax,
      keywordNames,
      keywords,
      property,
    }: {
      syntax: string
      keywordNames: Set<string>
      keywords: ProcessedKeywords
      property: string
    }) => {
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
              recursiveWalk({
                syntax: type.syntax,
                keywords,
                property,
                keywordNames,
              })
            }
          }

          if (node.type === 'Keyword' && !keywordNames.has(node.name)) {
            keywordNames.add(node.name)

            keywords.push({
              value: node.name,
              description: keywordDescriptionsByProperty[property]?.[node.name],
            })
          }
        },
      )
    }

    return Object.entries(properties).reduce((result, [property, data]) => {
      const keywordNames: Set<string> = new Set()
      const processedKeywords: ProcessedKeywords = []

      if (data.syntax) {
        recursiveWalk({
          syntax: data.syntax,
          keywords: processedKeywords,
          property,
          keywordNames,
        })
      }

      return {
        ...result,
        [property]: reorderKeywords(
          property,
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
