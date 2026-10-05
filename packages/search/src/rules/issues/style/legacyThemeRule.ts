import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { IssueRule, ProjectThemeNode } from '../../../types'

export const legacyThemeRule: IssueRule<unknown, ProjectThemeNode> = {
  code: 'legacy theme',
  level: 'warning',
  category: 'Deprecation',
  nodeTypes: 'project-theme',
  visit: (report, data) => {
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
