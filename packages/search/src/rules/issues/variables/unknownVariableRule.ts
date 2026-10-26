import type { FormulaNode, IssueRule } from '../../../types'

export const unknownVariableRule: IssueRule<
  {
    name: string | number
  },
  FormulaNode
> = {
  code: 'unknown variable',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'formula',
  visit: (report, { path, files, value }) => {
    if (value.type !== 'path' || value.path[0] !== 'Variables') {
      return
    }

    const [, componentName] = path
    const [, variableKey] = value.path
    const component = files.components[componentName]
    if (!component?.variables?.[variableKey]) {
      report({
        path,
        info: {
          title: 'Unknown variable',
          description: `**${variableKey}** does not exist. Make sure to define it before usage.`,
        },
        details: { name: variableKey },
      })
    }
  },
}
