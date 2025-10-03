import type { ApiRequest } from '@nordcraft/core/dist/api/apiTypes'
import type { Rule } from '../../../types'

export const unknownApiInputRule: Rule<{
  name: string
}> = {
  code: 'unknown api input',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'formula' ||
      value.type !== 'path' ||
      value.path[0] !== 'ApiInputs' ||
      typeof value.path[1] !== 'string' ||
      path.length < 4
    ) {
      return
    }
    const [_components, componentName, _apis, apiKey] = path
    if (typeof apiKey !== 'string') {
      return
    }
    const apiInput = (
      files.components?.[componentName]?.apis?.[apiKey] as
        | ApiRequest
        | undefined
    )?.inputs?.[value.path[1]]
    if (!apiInput) {
      report(path, { name: value.path[1] })
    }
  },
}
