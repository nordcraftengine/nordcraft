import type {
  ActionModelNode,
  Category,
  Code,
  IssueRule,
  Level,
} from '../../../types'

/**
 * Generic rule factory for creating a rule that checks for a specific action name.
 * Useful for extending other rules, such as for deprecated actions.
 * @example
 * myRule = () => createActionNameRule('myAction', myRule.code)
 */
export function createActionNameRule({
  name,
  code,
  info,
  category = 'Other',
  level = 'info',
}: {
  name: string
  code: Code
  info: {
    title: string
    description: string
  }
  category?: Category
  level?: Level
}): IssueRule<
  {
    name: string
  },
  ActionModelNode
> {
  return {
    code,
    category,
    level,
    nodeTypes: 'action-model',
    visit: (report, { path, value }) => {
      if (
        (value.type !== undefined && value.type !== 'Custom') ||
        value.name !== name
      ) {
        return
      }

      report({
        path,
        details: { name: value.name },
        info,
      })
    },
  }
}
