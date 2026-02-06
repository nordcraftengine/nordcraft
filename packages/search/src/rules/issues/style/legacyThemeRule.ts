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

    report({
      path: data.path,
      info: {
        title: `Legacy theme`,
        description: `You are using an older Nordcraft theme system. Migrate your theme to the newest version to enable multi-theme support and more.`,
      },
    })
  },
}
