import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../../types'

export const unknownClassnameRule: Rule<{
  name: string
}> = {
  code: 'unknown classname',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, value, nodeType }) => {
    if (
      nodeType !== 'style-variant' ||
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
