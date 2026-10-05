import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type { ComponentAPINode, IssueRule } from '../../../types'

export const legacyApiRule: IssueRule<
  {
    name: string
  },
  ComponentAPINode
> = {
  code: 'legacy api',
  level: 'warning',
  category: 'Deprecation',
  nodeTypes: 'component-api',
  visit: (report, { path, value }) => {
    if (!isLegacyApi(value)) {
      return
    }
    report({
      path,
      info: {
        title: 'Legacy API',
        description: `The API **${value.name}** could be upgraded to the new API format.`,
      },
      details: { name: value.name },
    })
  },
}
