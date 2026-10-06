import type { ActionModelNode, IssueRule } from '../../../types'

export const unknownTriggerEventRule: IssueRule<
  {
    name: string
  },
  ActionModelNode
> = {
  code: 'unknown trigger event',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'action-model',
  visit: (report, { path, files, value }) => {
    if (value.type !== 'TriggerEvent') {
      return
    }

    const [, componentName] = path
    const component = files.components[componentName]
    if (!component?.events?.some((e) => e?.name === value.event)) {
      report({
        path,
        info: {
          title: 'Unknown event trigger',
          description: `Event **${value.event}** does not exist. Make sure to define it before triggering it.`,
        },
        details: { name: value.event },
      })
    }
  },
}
