import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Level, Rule } from '../../types'

export function createRequiredElementAttributeRule({
  tag,
  attribute,
  level = 'warning',
  allowEmptyString = false,
}: {
  tag: string
  attribute: string
  level?: Level
  allowEmptyString?: boolean
}): Rule<{
  tag: string
  attribute: string
}> {
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
        const attributeValue = value.attrs[attribute]
        // Report the missing attribute if it is not defined or statically empty/nullish
        if (!isDefined(attributeValue)) {
          return report(path, { tag, attribute })
        }
        if (attributeValue.type === 'value') {
          if (!isDefined(attributeValue.value)) {
            return report(path, { tag, attribute })
          }
          if (!allowEmptyString && attributeValue.value === '') {
            return report(path, { tag, attribute })
          }
        }
      }
    },
  }
}
