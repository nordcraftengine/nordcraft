import type { Rule } from '../../../types'

export const unknownVariableSetterRule: Rule<{
  name: string
}> = {
  code: 'unknown variable setter',
  level: 'warning',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (nodeType !== 'action-model' || value.type !== 'SetVariable') {
      return
    }

    const [, componentName] = path
    const component = files.components[componentName]
    if (!component?.variables?.[value.variable]) {
      report(path, { name: value.variable })
    }
  },
}
