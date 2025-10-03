import type { Rule } from '../../../types'

export const unknownTriggerWorkflowRule: Rule<void> = {
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
      report(path)
    }
  },
}
