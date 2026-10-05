import { isFormula } from '@nordcraft/core/dist/formula/formula'
import type { ComponentNode, IssueRule, Level } from '../../../types'

export function createRequiredMetaTagRule(
  tag: string,
  level: Level = 'warning',
): IssueRule<
  {
    tag: string
  },
  ComponentNode
> {
  return {
    code: 'required meta tag',
    level: level,
    category: 'SEO',
    nodeTypes: 'component',
    visit: (report, { path, value }) => {
      if (!value.route) {
        return
      }

      const tagValue = value.route.info?.[tag as keyof typeof value.route.info]
      const formula = isFormula(tagValue?.formula)
        ? tagValue.formula
        : undefined

      if (
        !tagValue ||
        !formula ||
        (formula.type === 'value' && !formula.value)
      ) {
        report({
          path,
          info: {
            title: 'Missing meta tag',
            description: `**${tag}** is a required tag on page **${
              path[1]
            }**. Missing tags may impact SEO performance. \n[Learn more](${
              tag === 'title'
                ? 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/title'
                : 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta'
            })`,
          },
          details: { tag: tag },
        })
      }
    },
  }
}
