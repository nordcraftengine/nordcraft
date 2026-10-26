import type { ComponentContext, IssueRule } from '../../../types'

export const unknownContextProviderRule: IssueRule<
  { componentName: string },
  ComponentContext
> = {
  code: 'unknown context provider',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'component-context',
  visit: (report, { path, files, value }) => {
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
