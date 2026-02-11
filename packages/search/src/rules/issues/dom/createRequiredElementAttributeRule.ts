import { isDefined, toBoolean } from '@nordcraft/core/dist/utils/util'
import type { Level, Rule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'

/**
 * @param tag - The HTML tag of the element to check (e.g., 'img', 'a').
 * @param attribute - The required attribute that must be present on the element (e.g., 'alt', 'href'). Can also be an array of attributes to check where any one being present is sufficient. Only the first attribute will be reported in the issue details.
 * @param level - The severity level of the issue ('warning' by default).
 * @param allowEmptyString - Whether to allow the attribute to be an empty string (false by default).
 * @returns An issue rule that reports when an element of the specified tag is missing the specified attribute.
 */
export function createRequiredElementAttributeRule({
  tag,
  attribute,
  level = 'warning',
  allowEmptyString = false,
}: {
  tag: string
  attribute: string | string[]
  level?: Level
  allowEmptyString?: boolean
}): Rule<{
  tag: string
  attribute: string
}> {
  const mainAttribute = Array.isArray(attribute) ? attribute[0] : attribute
  return {
    code: 'required element attribute',
    level: level,
    category: 'Accessibility',
    visit: (report, { path, nodeType, value }) => {
      if (
        nodeType === 'component-node' &&
        value.type === 'element' &&
        value.tag === tag
      ) {
        const attributes = Array.isArray(attribute) ? attribute : [attribute]
        if (
          attributes.some((attr) => {
            if (!isDefined(value.attrs[attr])) {
              return false
            }
            const { isStatic, result } = contextlessEvaluateFormula(
              value.attrs[attr],
            )
            return (
              // Dynamic attributes are considered valid
              !isStatic ||
              // Static attributes must be truthy as falsy values are not rendered
              (isDefined(result) &&
                toBoolean(result) &&
                (allowEmptyString || result !== ''))
            )
          })
        ) {
          return
        }

        report({
          path,
          info: {
            title: 'Missing required attribute',
            description: `**${mainAttribute}** is a required attribute on **${tag}** elements.\n[Learn more](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes)`,
          },
          details: { tag, attribute: mainAttribute },
        })
      }
    },
  }
}
