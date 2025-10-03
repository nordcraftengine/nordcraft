import type { Category, Code, Level, Rule } from '../../../types'

/**
 * Generic rule factory for creating a rule that checks for a specific action name.
 * Useful for extending other rules, such as for deprecated actions.
 * @example
 * myRule = () => createActionNameRule('myAction', myRule.code)
 */
export function createActionNameRule({
  name,
  code,
  category = 'Other',
  level = 'info',
}: {
  name: string
  code: Code
  category?: Category
  level?: Level
}): Rule<{
  name: string
}> {
  return {
    code,
    category,
    level,
    visit: (report, { path, value, nodeType }) => {
      if (
        nodeType !== 'action-model' ||
        (value.type !== undefined && value.type !== 'Custom') ||
        value.name !== name
      ) {
        return
      }

      report(path, { name: value.name })
    },
  }
}
