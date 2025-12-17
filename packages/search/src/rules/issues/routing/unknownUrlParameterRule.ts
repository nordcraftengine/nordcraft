import type { Rule } from '../../../types'

export const unknownUrlParameterRule: Rule<{
  name: string | number
}> = {
  code: 'unknown url parameter',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'formula' ||
      value.type !== 'path' ||
      value.path[0] !== 'URL parameters'
    ) {
      return
    }

    const [, componentName] = path
    const [, parameterKey] = value.path
    const component = files.components[componentName]
    if (
      !component?.route?.query?.[parameterKey] &&
      !component?.route?.path?.some((p) => p.name === parameterKey)
    ) {
      report(path, { name: parameterKey })
    }
  },
}
