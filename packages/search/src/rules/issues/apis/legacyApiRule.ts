import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type { IssueRule } from '../../../types'

export const legacyApiRule: IssueRule<{
  name: string
}> = {
  code: 'legacy api',
  level: 'warning',
  category: 'Deprecation',
  visit: (report, { path, value, nodeType }) => {
    if (nodeType !== 'component-api' || !isLegacyApi(value)) {
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
