import type { ActionModelNode, IssueRule, NodeType } from '../../../types'
import { addContextSubscription } from './unknownContextWorkflowRule.fix'

export const unknownContextWorkflowRule: IssueRule<
  {
    providerName: string
    workflowName: string
  },
  ActionModelNode
> = {
  code: 'unknown context workflow',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      path[0] !== 'components' ||
      (nodeType as NodeType['nodeType']) !== 'action-model' ||
      value.type !== 'TriggerWorkflow' ||
      !value.contextProvider
    ) {
      return
    }

    const contexts = files.components[path[1]]?.contexts ?? {}
    const context = (contexts as any)[value.contextProvider]
    if (context?.workflows.includes(value.workflow)) {
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
      fixes: ['add-context-subscription'],
    })
  },
  fixes: {
    'add-context-subscription': addContextSubscription,
  },
}

export type UnknownContextWorkflowRuleFix = 'add-context-subscription'
