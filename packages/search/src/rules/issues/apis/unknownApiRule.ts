import type { Rule } from '../../../types'

export const unknownApiRule: Rule<{
  name: string
}> = {
  code: 'unknown api',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    const isApiFormula =
      nodeType === 'formula' &&
      value.type === 'path' &&
      value.path[0] === 'Apis'
    const isApiAction =
      nodeType === 'action-model' &&
      (value.type === 'Fetch' || value.type === 'AbortFetch')
    if (!isApiFormula && !isApiAction) {
      return
    }
    const [, componentName] = path
    const component = files.components[componentName]
    if (isApiFormula) {
      const [, apiKey] = value.path
      if (!component?.apis?.[apiKey]) {
        report(path, { name: apiKey })
      }
    } else if (isApiAction) {
      if (!component?.apis?.[value.api]) {
        report(path, { name: value.api })
      }
    }
  },
}
