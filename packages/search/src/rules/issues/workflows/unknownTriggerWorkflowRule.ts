import type { ActionModelNode, IssueRule } from '../../../types'

export const unknownTriggerWorkflowRule: IssueRule<
  { workflow: string },
  ActionModelNode
> = {
  code: 'unknown trigger workflow',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'action-model',
  visit: (report, args) => {
    const { path, value } = args
    if (
      value.type !== 'TriggerWorkflow' ||
      typeof value.contextProvider === 'string'
    ) {
      return
    }

    const workflow = args.component.workflows?.[value.workflow]
    if (!workflow) {
      report({
        path,
        details: {
          workflow: value.workflow,
        },
        info: {
          title: 'Unknown workflow trigger',
          description: `This workflow does not exist and cannot be triggered.`,
        },
      })
    }
  },
}
