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
      isDefined(value.element.classes[value.variant.className])
    ) {
      return
    }
    report(path, { name: value.variant.className })
  },
}
