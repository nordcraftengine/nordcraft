import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../../types'

export const legacyThemeRule: Rule = {
  code: 'legacy theme',
  level: 'warning',
  category: 'Deprecation',
  visit: (report, data) => {
    if (data.nodeType !== 'project-theme') {
      return
    }

    if (isDefined(data.value.propertyDefinitions)) {
      return
    }

    report(data.path, undefined, [])
  },
}
