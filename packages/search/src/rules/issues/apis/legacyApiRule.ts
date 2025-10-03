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
    report(path, { name: value.name })
  },
}
