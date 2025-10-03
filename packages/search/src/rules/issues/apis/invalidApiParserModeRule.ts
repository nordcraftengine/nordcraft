import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type { Rule } from '../../../types'

export const invalidApiParserModeRule: Rule<{ api: string }> = {
  code: 'invalid api parser mode',
  level: 'warning',
  category: 'Quality',
  visit: (report, args) => {
    if (args.nodeType !== 'component-api') {
      return
    }
    const { path, value } = args
    if (
      isLegacyApi(value) ||
      typeof value.client?.parserMode !== 'string' ||
      ['json', 'text', 'auto'].includes(value.client.parserMode) ||
      value.server?.ssr?.enabled?.formula === undefined ||
      (value.server.ssr.enabled.formula.type === 'value' &&
        value.server.ssr.enabled.formula.value === false)
    ) {
      return
    }

    report(path, { api: value.name })
  },
}
