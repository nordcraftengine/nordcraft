import type { Rule } from '../../../types'

export const unknownVariableRule: Rule<{
  name: string | number
}> = {
  code: 'unknown variable',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'formula' ||
      value.type !== 'path' ||
      value.path[0] !== 'Variables'
    ) {
      return
    }

    const [, componentName] = path
    const [, variableKey] = value.path
    const component = files.components[componentName]
    if (!component?.variables?.[variableKey]) {
      report(path, { name: variableKey })
    }
  },
}
