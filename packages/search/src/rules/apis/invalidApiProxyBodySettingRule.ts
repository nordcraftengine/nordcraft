import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type { Rule } from '../../types'

export const invalidApiProxyBodySettingRule: Rule<{ api: string }> = {
  code: 'invalid api proxy body setting',
  level: 'warning',
  category: 'Quality',
  visit: (report, args) => {
    if (args.nodeType !== 'component-api') {
      return
    }
    const { path, value } = args
    if (
      isLegacyApi(value) ||
      value.server?.proxy?.useTemplatesInBody?.formula.type !== 'value' ||
      value.server.proxy.useTemplatesInBody.formula.value === false ||
      (value.server.proxy.enabled.formula.type === 'value' &&
        value.server.proxy.enabled.formula.value === true)
    ) {
      return
    }
    // Report an issue if useTemplatesInBody is set to true while the API is not set to be proxied
    report(path, { api: value.name })
  },
}
