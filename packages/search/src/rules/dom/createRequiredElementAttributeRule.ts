import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Level, Rule } from '../../types'

export function createRequiredElementAttributeRule(
  tag: string,
  attribute: string,
  level: Level = 'warning',
): Rule<{
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
        if (
          !isDefined(attributeValue) ||
          (attributeValue.type === 'value' &&
            (attributeValue.value === '' || !isDefined(attributeValue.value)))
        ) {
          // Report the missing attribute if it is not defined or statically empty/nullish
          report(path, { tag, attribute })
        }
      }
    },
  }
}
