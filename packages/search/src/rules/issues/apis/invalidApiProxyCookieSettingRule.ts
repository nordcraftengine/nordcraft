import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import { get } from '@nordcraft/core/dist/utils/collections'
import type { Rule } from '../../../types'

export const invalidApiProxyCookieSettingRule: Rule<{ api: string }> = {
  code: 'invalid api proxy body setting',
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
      api.server.proxy.enabled.formula.value !== true
    ) {
      return
    }
    // Report an issue if the  is set to true while the API is not set to be proxied
    report(path, { api: api.name })
  },
}
