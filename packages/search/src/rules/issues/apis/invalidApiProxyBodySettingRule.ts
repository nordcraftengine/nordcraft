import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type { ComponentAPINode, IssueRule } from '../../../types'

export const invalidApiProxyBodySettingRule: IssueRule<
  { api: string },
  ComponentAPINode
> = {
  code: 'invalid api proxy body setting',
  level: 'warning',
  category: 'Quality',
  nodeTypes: 'component-api',
  visit: (report, args) => {
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
    report({
      path,
      info: {
        title: 'Invalid API setting for cookies in body',
        description: `The API **${value.name}** has enabled the setting for injecting cookies in the proxied API body, but the API does not have proxying enabled.`,
      },
      details: { api: value.name },
    })
  },
}
