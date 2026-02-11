import type { Rule } from '../../../types'

export const unknownContextProviderRule: Rule<{ componentName: string }> = {
  code: 'unknown context provider',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (nodeType !== 'component-context') {
      return
    }

    if (!value.componentName) {
      return
    }

    if (value.package) {
      const _package = files.packages?.[value.package]
      if (_package?.components[value.componentName]) {
        return
      }
    } else {
      const component = files.components[value.componentName]
      if (component) {
        return
      }
    }

    report({
      path,
      info: {
        title: 'Unknown context provider',
        description: `**${value.componentName}** component or page does not exist and cannot be subscribed. Make sure to define it before using it.`,
      },
      details: { componentName: value.componentName },
    })
  },
}
