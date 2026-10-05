import type { ComponentWorkflowNode, IssueRule } from '../../../types'
import { renameNamedComponentWorkflowFix } from './namedComponentWorkflowRule.fix'

export const namedComponentWorkflowRule: IssueRule<
  { name: string; workflowKey: string | number },
  ComponentWorkflowNode
> = {
  code: 'named component workflow',
  level: 'info',
  category: 'Deprecation',
  nodeTypes: 'component-workflow',
  visit: (report, { value, path }) => {
    const workflowKey = path.at(-1)
    if (typeof value.name !== 'string' || typeof workflowKey !== 'string') {
      return
    }

    report({
      path,
      info: {
        title: 'Workflow has name property',
        description: `The name for the **${value.name}** workflow is declared directly on the workflow. Consider moving the name to the workflow key to reduce complexity in your project and help the AI perform better.`,
      },
      details: {
        name: value.name,
        workflowKey,
      },
      fixes: ['rename-named-component-workflow'],
    })
  },
  fixes: {
    'rename-named-component-workflow': renameNamedComponentWorkflowFix,
  },
}

export type NamedComponentWorkflowRuleFix = 'rename-named-component-workflow'
