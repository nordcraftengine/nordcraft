import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import { get } from '@nordcraft/core/dist/utils/collections'
import type { Rule } from '../../../types'

export const invalidApiProxyCookieSettingRule: Rule<{ api: string }> = {
  code: 'invalid api proxy cookie setting',
  level: 'warning',
  category: 'Quality',
  visit: (report, { files, nodeType, value, path }) => {
    if (
      nodeType !== 'formula' ||
      value.type !== 'function' ||
      value.name !== '@toddle/getHttpOnlyCookie'
    ) {
      return
    }
    const [_components, componentName, apis, apiName] = path
    if (
      apis !== 'apis' ||
      typeof componentName !== 'string' ||
      typeof apiName !== 'string'
    ) {
      return
    }
    const api = get(files, ['components', componentName, 'apis', apiName])
    if (
      !api ||
      isLegacyApi(api) ||
      api.server?.proxy?.enabled?.formula.type !== 'value' ||
      api.server.proxy.enabled.formula.value !== false
    ) {
      return
    }
    // Report an issue if the 'Get Http-Only Cookie' formula is used in a non-proxied API
    report({
      path,
      info: {
        title: 'Proxy specific formula used in non-proxied API',
        description: `The **"Get Http-Only Cookie"** formula is used in the **${api.name}** API, but the API is not proxied. This will often lead to issues with the API when [the template value for the cookie](https://docs.nordcraft.com/connecting-data/authentication#adding-authentication-to-api-requests) is not replaced correctly.`,
      },
      details: { api: api.name },
    })
  },
}
