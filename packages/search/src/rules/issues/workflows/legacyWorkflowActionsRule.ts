import { nanoid } from '@nordcraft/ssr'
import type {
  ComponentWorkflowNode,
  FixFunction,
  IssueRule,
} from '../../../types'

const replaceLegacyWorkflowActionsFix: FixFunction<ComponentWorkflowNode> = ({
  data: { path, value },
}) => {
  if (!Array.isArray(value.actions)) {
    return
  }

  return {
    path: [...path, 'actions'],
    value: Object.fromEntries(
      value.actions.map((action, index) => [
        nanoid(6),
        {
          ...action,
          index,
        },
      ]),
    ),
  }
}

export const legacyWorkflowActionsRule: IssueRule<
  { name: string },
  ComponentWorkflowNode
> = {
  code: 'legacy workflow actions',
  level: 'info',
  category: 'Deprecation',
  nodeTypes: 'component-workflow',
  visit: (report, { value, path }) => {
    const workflowKey = path.at(-1)
    if (!Array.isArray(value.actions) || typeof workflowKey !== 'string') {
      return
    }
    const name = value.name ?? workflowKey

    report({
      path,
      info: {
        title: 'Workflow actions defined as an array',
        description: `Actions in the **${name}** workflow are defined as an array. Consider converting them to an object to make workflow changes easier to compare and visualize.`,
      },
      details: {
        name,
      },
      fixes: ['replace-legacy-workflow-actions'],
    })
  },
  fixes: {
    'replace-legacy-workflow-actions': replaceLegacyWorkflowActionsFix,
  },
}

export type LegacyWorkflowActionsRuleFix = 'replace-legacy-workflow-actions'
