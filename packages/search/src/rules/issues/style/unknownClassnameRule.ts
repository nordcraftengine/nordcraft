import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { IssueRule, StyleVariantNode } from '../../../types'

export const unknownClassnameRule: IssueRule<
  {
    name: string
  },
  StyleVariantNode
> = {
  code: 'unknown classname',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'style-variant',
  visit: (report, { path, value }) => {
    if (
      typeof value.variant.className !== 'string' ||
      value.element.type !== 'element' ||
      isDefined(value.element.classes?.[value.variant.className])
    ) {
      return
    }
    report({
      path,
      info: {
        title: 'Unknown classname',
        description: `**${value.variant.className}** is not defined. Using an unknown classname will have no effect.`,
      },
      details: { name: value.variant.className },
    })
  },
}
