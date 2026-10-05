import type { ActionModelNode, IssueRule } from '../../../types'

export const unknownVariableSetterRule: IssueRule<
  {
    name: string
  },
  ActionModelNode
> = {
  code: 'unknown variable setter',
  level: 'warning',
  category: 'Unknown Reference',
  nodeTypes: 'action-model',
  visit: (report, { path, files, value }) => {
    if (value.type !== 'SetVariable') {
      return
    }

    const [, componentName] = path
    const component = files.components[componentName]
    if (!component?.variables?.[value.variable]) {
      report({
        path,
        info: {
          title: 'Unknown variable setter',
          description: `**${value.variable}** does not exist. Make sure to define it before setting.`,
        },
        details: { name: value.variable },
      })
    }
  },
}
