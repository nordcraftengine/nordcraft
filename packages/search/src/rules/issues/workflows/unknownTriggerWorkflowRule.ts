import type { IssueRule } from '../../../types'

export const unknownTriggerWorkflowRule: IssueRule<{ workflow: string }> = {
  code: 'unknown trigger workflow',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, args) => {
    const { path, value, nodeType } = args
    if (
      nodeType !== 'action-model' ||
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
