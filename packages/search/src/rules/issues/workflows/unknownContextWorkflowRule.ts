import type { Rule } from '../../../types'

export const unknownContextWorkflowRule: Rule<{
  providerName: string
  workflowName: string
}> = {
  code: 'unknown context workflow',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      path[0] !== 'components' ||
      nodeType !== 'action-model' ||
      value.type !== 'TriggerWorkflow' ||
      !value.contextProvider
    ) {
      return
    }

    const contexts = files.components[path[1]]?.contexts ?? {}
    if (contexts[value.contextProvider]?.workflows.includes(value.workflow)) {
      return
    }

    report({
      path,
      info: {
        title: 'Unknown context workflow',
        description: `**${value.workflow}** is not subscribed. Make sure to subscribe to it in the component context section before using it.`,
      },
      details: {
        providerName: value.contextProvider,
        workflowName: value.workflow,
      },
    })
  },
}
