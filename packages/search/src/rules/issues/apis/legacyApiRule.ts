import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type { Rule } from '../../../types'

export const legacyApiRule: Rule<{
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
